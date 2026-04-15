import {
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Headers,
  Body,
  Ip,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaystackService } from './paystack.service';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { VemtapService } from '../integration/vemtap.service';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private paystackService: PaystackService,
    private prisma: PrismaService,
    private pricingService: PricingService,
    private vemtapService: VemtapService,
  ) {}

  @Post('initialize')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initialize a Paystack transaction for a tiered plan' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        planId: { type: 'string', example: 'cuid_here' },
        interval: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'], example: 'monthly' },
      },
      required: ['planId', 'interval'],
    },
  })
  @ApiResponse({ status: 200, description: 'Transaction initialized successfully.' })
  @ApiResponse({ status: 400, description: 'Plan not found, inactive, or invalid interval.' })
  async initialize(
    @Req() req: Request & { user: { userId: string } },
    @Ip() ip: string,
    @Body() body: { planId: string; interval: 'monthly' | 'quarterly' | 'yearly' },
  ) {
    const userId = req.user.userId;
    const { planId, interval } = body;

    // 5. Initialize transaction
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Resolve country - Prioritize locked account country over current IP
    const country = (user.countryCode || req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || this.pricingService.getCountryCodeByIp(ip)) as string;

    // 1. Fetch Plan with localized pricing
    const plan = await this.pricingService.getPlanWithPricing(planId, country);

    // 2. Validate Plan status
    if (!plan.isActive) {
      throw new BadRequestException('This plan is currently deactivated and not accepting new subscriptions.');
    }

    if (plan.isDefault) {
      throw new BadRequestException('Cannot pay for a free/default plan.');
    }

    // 3. Get the correct price and plan code for the interval
    const pricing = (plan.pricing as any)[interval];
    const amount = pricing?.amount;
    const paystackPlanCode = pricing?.gatewayIds?.paystack;

    if (amount === undefined || amount < 0) {
      throw new BadRequestException('Invalid price for the selected interval.');
    }

    // Get tier name for metadata
    const countryInfo = await this.pricingService.getCountryInfo(country);

    return this.paystackService.initializeTransaction(
      user.email,
      amount,
      paystackPlanCode, 
      { 
        userId, 
        planId, 
        interval,
        tierName: countryInfo?.tier || 'Unknown'
      },
    );
  }
  
  @Post('subscribe-free')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Subscribe to a free plan directly' })
  @ApiBody({
      schema: {
          type: 'object',
          properties: {
              planId: { type: 'string' }
          },
          required: ['planId']
      }
  })
  @ApiResponse({ status: 200, description: 'Subscribed to free plan successfully.' })
  async subscribeFree(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { planId: string },
  ) {
    const userId = req.user.userId;
    const { planId } = body;

    const user = await this.prisma.user.findUnique({ 
        where: { id: userId },
        include: { plan: true }
    });
    if (!user) throw new BadRequestException('User not found');

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Plan not found');
    if (!plan.isFree) throw new BadRequestException('This endpoint is only for free plans');
    if (!plan.isActive) throw new BadRequestException('Plan is inactive');

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: { connect: { id: planId } },
        subscriptionStatus: 'active',
        billingCycle: null,
        paystackSubscriptionCode: null, // Clear subscription as they moved to free
      },
      include: { plan: true }
    });

    // Sync with Vemtap
    if (updatedUser.plan?.vemtapPlanId) {
      this.vemtapService.provisionUser(
        updatedUser.email,
        updatedUser.firstName,
        updatedUser.lastName,
        updatedUser.plan.vemtapPlanId,
      ).catch(err => {
        this.logger.error(`Vemtap provisioning failed during free subscription for ${user.email}:`, err);
      });
    }

    return { message: 'Successfully subscribed to the free plan.', planName: plan.name };
  }

  @Post('cancel')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel an active subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancellation initiated.' })
  async cancel(@Req() req: { user: { userId: string } }) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.paystackSubscriptionCode) {
      throw new BadRequestException('No active subscription found to cancel.');
    }

    // In a real scenario, we might want to also allow them to use it until the end of the period
    // but for now, we just disable it in Paystack if they have a code.
    // We'll need a way to get the email token if Paystack requires it, 
    // but usually, just the code is enough if authorized.
    
    // For now, we'll just mark it as cancelled in our DB and let Paystack events handle the rest
    // or call Paystack service if we have the token stored.
    // Since we don't store the email token yet, we'll just update the status.
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: 'non-renewing' },
    });

    return { message: 'Your subscription will not renew at the end of the current cycle.' };
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack Webhook endpoint' })
  @ApiHeader({
    name: 'x-paystack-signature',
    description: 'HMAC SHA512 signature of the payload',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid signature or payload.' })
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: { event: string; data: any },
  ) {
    if (!signature) {
      throw new BadRequestException('Signature missing');
    }

    // Since NestJS already parsed the body, we need to stringify it identically
    // Note: In production, it's safer to use a raw body middleware for webhooks
    const payload = JSON.stringify(body);
    const isValid = this.paystackService.verifyWebhookSignature(
      payload,
      signature,
    );

    if (!isValid) {
      this.logger.warn('Invalid Paystack signature');
      throw new BadRequestException('Invalid signature');
    }

    const { event, data } = body;
    this.logger.log(`Received Paystack event: ${event}`);

    try {
      switch (event) {
        case 'charge.success':
          await this.handleChargeSuccess(data);
          break;
        case 'subscription.disable':
          await this.handleSubscriptionDisable(data);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(data);
          break;
        default:
          this.logger.log(`Unhandled Paystack event: ${event}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing Paystack event ${event}:`,
        error.stack,
      );
      // Still return 200 to Paystack to stop retries if it's a known error
    }

    return { status: 'success' };
  }

  private async handleChargeSuccess(data: {
    customer: { email: string; customer_code: string };
    plan?: { interval: string };
    subscription?: { subscription_code: string };
    metadata?: any;
  }) {
    const { customer, plan, subscription } = data;
    const email = customer.email;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.error(
        `User with email ${email} not found for charge.success`,
      );
      return;
    }

    let metadata = data.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        this.logger.error('Failed to parse Paystack metadata JSON string:', metadata);
        metadata = {};
      }
    }

    const { planId, interval } = metadata || {};

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: planId ? { connect: { id: planId } } : undefined,
        paystackCustomerCode: customer.customer_code,
        paystackSubscriptionCode: subscription?.subscription_code || null,
        subscriptionStatus: 'active',
        billingCycle: interval || plan?.interval || null,
        hasUsedTrial: true, // Mark that they've now paid/used a trial
        trialEndsAt: null,   // Clear trial as they are now active
      },
      include: { plan: true },
    });

    this.logger.log(`User ${email} upgraded to plan ${planId || 'PRO'}`);

    // Vemtap Provisioning logic
    if (updatedUser.plan?.vemtapPlanId) {
      // Fire and forget provisioning to not block response
      this.vemtapService.provisionUser(
        updatedUser.email,
        updatedUser.firstName,
        updatedUser.lastName,
        updatedUser.plan.vemtapPlanId,
      ).catch(err => {
        this.logger.error(`Deferred Vemtap provisioning failed for ${email}:`, err);
      });
    }
  }

  private async handleSubscriptionDisable(data: {
    customer: { email: string };
    subscription_code: string;
  }) {
    const { customer } = data;
    const email = customer.email;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return;

    const freePlan = await this.prisma.plan.findFirst({ where: { isDefault: true } });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: freePlan ? { connect: { id: freePlan.id } } : undefined,
        subscriptionStatus: 'cancelled',
      },
    });

    this.logger.log(`User ${email} downgraded to FREE (Subscription Disabled)`);
  }

  private async handleInvoicePaymentFailed(data: {
    customer: { email: string };
  }) {
    const { customer } = data;
    const email = customer.email;
    this.logger.warn(`Payment failed for user: ${email}`);
    // Optional: Notify user or mark subscription for attention
  }
}
