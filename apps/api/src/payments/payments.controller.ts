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
import type { RawBodyRequest } from '@nestjs/common';
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

  @Post('verify')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify a Paystack transaction directly' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reference: { type: 'string' },
      },
      required: ['reference'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction verified and plan updated.',
  })
  async verify(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { reference: string; planId?: string; interval?: string },
  ) {
    const userId = req.user.userId;
    const { reference, planId: requestedPlanId, interval: requestedInterval } = body;

    this.logger.log(
      `Direct verification requested for reference: ${reference} by user ${userId}, requestedPlanId: ${requestedPlanId}, requestedInterval: ${requestedInterval}`,
    );

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const transactionData =
      await this.paystackService.verifyTransaction(reference);

    if (transactionData.status !== 'success') {
      throw new BadRequestException('Transaction not successful on Paystack.');
    }

    // Get planId and interval from metadata or from request body
    let metadata = transactionData.metadata;
    if (typeof metadata === 'string' && metadata.length > 0) {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }
    
    const planId = metadata?.planId || metadata?.plan_id || requestedPlanId;
    const interval = metadata?.interval || metadata?.billing_cycle || requestedInterval;

    // Validate interval matches if provided in request
    if (requestedInterval && interval && requestedInterval !== interval) {
      this.logger.error(`Interval mismatch: requested ${requestedInterval}, but got ${interval}`);
      throw new BadRequestException('Payment interval mismatch.');
    }

    // Process with explicit user and planId
    await this.handleChargeSuccess(transactionData, user, planId);

    return {
      status: 'success',
      message: 'Payment verified and account upgraded.',
    };
  }

  @Post('initialize')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Initialize a Paystack transaction for a tiered plan',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        planId: { type: 'string', example: 'cuid_here' },
        interval: {
          type: 'string',
          enum: ['monthly', 'quarterly', 'yearly'],
          example: 'monthly',
        },
      },
      required: ['planId', 'interval'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction initialized successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Plan not found, inactive, or invalid interval.',
  })
  async initialize(
    @Req() req: Request & { user: { userId: string } },
    @Ip() ip: string,
    @Body()
    body: {
      planId: string;
      interval: 'monthly' | 'quarterly' | 'yearly';
      isTrial?: boolean;
    },
  ) {
    const userId = req.user.userId;
    const { planId, interval } = body;

    this.logger.log(
      `Initializing payment for user ${userId}, plan ${planId}, interval ${interval}`,
    );

    // 5. Initialize transaction
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isActive =
      user.subscriptionStatus === 'active' ||
      user.subscriptionStatus === 'trialing' ||
      user.subscriptionStatus === 'non-renewing';
    if (user.planId === planId && isActive) {
      throw new BadRequestException(
        'You already have an active subscription for this plan.',
      );
    }

    // Resolve country - Prioritize locked account country over current IP
    const country = (user.countryCode ||
      req.headers['cf-ipcountry'] ||
      req.headers['x-vercel-ip-country'] ||
      this.pricingService.getCountryCodeByIp(ip)) as string;
    this.logger.log(`Resolved country: ${country}`);

    // 1. Fetch Plan with localized pricing
    const plan = await this.pricingService.getPlanWithPricing(planId, country);
    this.logger.log(`Fetched plan: ${plan.name}`);

    // 2. Validate Plan status
    if (!plan.isActive) {
      throw new BadRequestException(
        'This plan is currently deactivated and not accepting new subscriptions.',
      );
    }

    if (plan.isDefault) {
      throw new BadRequestException('Cannot pay for a free/default plan.');
    }

    // 3. Get the correct price and plan code for the interval
    const pricing = (plan.pricing as any)[interval];
    let amount = pricing?.amount;
    let paystackPlanCode = pricing?.gatewayIds?.paystack;

    // Trial Tokenization Bypass
    if (body.isTrial) {
      if (user.hasUsedTrial)
        throw new BadRequestException('You have already used a free trial.');
      if (!plan.trialDays || plan.trialDays <= 0)
        throw new BadRequestException(
          'This plan does not have a trial period.',
        );

      const currency = pricing?.currency || 'USD';
      amount = currency === 'NGN' ? 100 : 1;
      paystackPlanCode = undefined; // Don't attach plan immediately to tokenize
    }

    this.logger.log(
      `Amount: ${amount}, PlanCode: ${paystackPlanCode}, isTrial: ${!!body.isTrial}`,
    );

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
        isTrial: body.isTrial ? 'true' : 'false',
        paystackPlanCode: body.isTrial
          ? pricing?.gatewayIds?.paystack
          : undefined,
        trialDays: body.isTrial ? plan.trialDays : undefined,
        tierName: countryInfo?.tier || 'Unknown',
      },
    );
  }

  @Post('start-trial')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Start a free trial for a plan (soft trial, no card required)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        planId: { type: 'string' },
      },
      required: ['planId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Trial started successfully.' })
  async startTrial(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { planId: string },
  ) {
    const userId = req.user.userId;
    const { planId } = body;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.hasUsedTrial)
      throw new BadRequestException('You have already used a free trial.');

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Plan not found');
    if (plan.trialDays <= 0)
      throw new BadRequestException('This plan does not have a trial period.');

    const now = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(now.getDate() + plan.trialDays);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: { connect: { id: planId } },
        subscriptionStatus: 'trialing',
        trialStartedAt: now,
        trialEndsAt: trialEndsAt,
        hasUsedTrial: true,
      },
      include: { plan: true },
    });

    // Provision on Vemtap
    if (updatedUser.plan?.vemtapPlanId) {
      this.vemtapService
        .provisionUser(
          updatedUser.email,
          updatedUser.firstName,
          updatedUser.lastName,
          updatedUser.plan.vemtapPlanId,
        )
        .catch((err) => {
          this.logger.error(
            `Vemtap provisioning failed during trial start for ${user.email}:`,
            err,
          );
        });
    }

    return {
      message: `Trial for ${plan.name} started successfully.`,
      trialEndsAt,
      planName: plan.name,
    };
  }

  @Post('subscribe-free')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Subscribe to a free plan directly' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        planId: { type: 'string' },
      },
      required: ['planId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Subscribed to free plan successfully.',
  })
  async subscribeFree(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { planId: string },
  ) {
    const userId = req.user.userId;
    const { planId } = body;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });
    if (!user) throw new BadRequestException('User not found');

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Plan not found');
    if (!plan.isFree)
      throw new BadRequestException('This endpoint is only for free plans');
    if (!plan.isActive) throw new BadRequestException('Plan is inactive');

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: { connect: { id: planId } },
        subscriptionStatus: 'active',
        billingCycle: null,
        paystackSubscriptionCode: null, // Clear subscription as they moved to free
      },
      include: { plan: true },
    });

    // Sync with Vemtap
    if (updatedUser.plan?.vemtapPlanId) {
      this.vemtapService
        .provisionUser(
          updatedUser.email,
          updatedUser.firstName,
          updatedUser.lastName,
          updatedUser.plan.vemtapPlanId,
        )
        .catch((err) => {
          this.logger.error(
            `Vemtap provisioning failed during free subscription for ${user.email}:`,
            err,
          );
        });
    }

    return {
      message: 'Successfully subscribed to the free plan.',
      planName: plan.name,
    };
  }

  @Post('cancel')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel an active subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancellation initiated.',
  })
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

    return {
      message:
        'Your subscription will not renew at the end of the current cycle.',
    };
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
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
    @Body() body: { event: string; data: any },
  ) {
    if (!signature) {
      throw new BadRequestException('Signature missing');
    }

    const payload = req.rawBody;
    if (!payload) {
      this.logger.error('Raw body NOT found for webhook. Ensure app.create({ rawBody: true }) is set.');
      throw new BadRequestException('Payload missing');
    }

    const isValid = this.paystackService.verifyWebhookSignature(
      payload,
      signature,
    );

    if (!isValid) {
      this.logger.warn('Invalid Paystack signature rejected.');
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

  private async handleChargeSuccess(
    data: {
      customer: { email: string; customer_code: string };
      plan?: { interval: string };
      subscription?: { subscription_code: string };
      metadata?: any;
      authorization?: { authorization_code: string };
    },
    overrideUser?: { id: string; email: string } | null,
    overridePlanId?: string | null,
  ) {
    const { customer, plan, subscription } = data;
    const email = customer.email;

    this.logger.log(`Processing charge.success for ${email}`);

    this.logger.log(`RAW data from Paystack: ${JSON.stringify(data, null, 2)}`);

    let metadata = data.metadata;
    if (typeof metadata === 'string' && metadata.length > 0) {
      try {
        metadata = JSON.parse(metadata);
        this.logger.log(`Parsed metadata from string: ${JSON.stringify(metadata, null, 2)}`);
      } catch (e) {
        this.logger.error(
          'Failed to parse Paystack metadata JSON string:',
          metadata,
        );
        metadata = {};
      }
    } else {
      this.logger.log(`Metadata was already object or empty: ${JSON.stringify(metadata, null, 2)}`);
    }

    const userId = overrideUser?.id || metadata?.userId || metadata?.user_id || metadata?.user_id_string;
    const planId = overridePlanId || metadata?.planId || metadata?.plan_id || metadata?.plan_id_string;
    const interval = metadata?.interval || metadata?.billing_cycle || metadata?.interval_string;

    const isTrial = metadata?.isTrial === 'true' || metadata?.isTrial === true;
    const trialDays = metadata?.trialDays ? parseInt(metadata.trialDays) : 14;
    const futurePlanCode = metadata?.paystackPlanCode;

    this.logger.log(
      `EXTRACTED CONTEXT: userId=${userId}, planId=${planId}, interval=${interval}, isTrial=${isTrial}`,
    );

    if (!userId && !email) {
      this.logger.error('No identifiable user data found in webhook payload/metadata');
      return;
    }

    // Use override user if provided, otherwise look up from metadata/email
    let user = overrideUser 
      ? await this.prisma.user.findUnique({ where: { id: overrideUser.id } })
      : (userId 
        ? await this.prisma.user.findUnique({ where: { id: userId } })
        : await this.prisma.user.findUnique({ where: { email } }));

    if (!user) {
      this.logger.error(
        `User not found for charge.success. email=${email}, userId=${userId}`,
      );
      return;
    }

    const trialEndsAt = isTrial
      ? new Date(Date.now() + trialDays * 86400000)
      : null;

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          plan: planId ? { connect: { id: planId } } : undefined,
          paystackCustomerCode: customer.customer_code,
          paystackSubscriptionCode: subscription?.subscription_code || null,
          subscriptionStatus: isTrial ? 'trialing' : 'active',
          billingCycle: interval || plan?.interval || null,
          hasUsedTrial: true,
          trialEndsAt: trialEndsAt,
        },
        include: { plan: true },
      });

      this.logger.log(
        `Successfully updated plan for user ${user.email} to ${updatedUser.plan?.name || 'Unknown'} (isTrial: ${isTrial})`,
      );

      // If Trial tokenization succeeded, set up the real subscription for the future
      if (
        isTrial &&
        futurePlanCode &&
        data.authorization?.authorization_code &&
        trialEndsAt
      ) {
        try {
          const sub = await this.paystackService.createSubscription(
            customer.customer_code,
            futurePlanCode,
            data.authorization.authorization_code,
            trialEndsAt.toISOString(),
          );

          await this.prisma.user.update({
            where: { id: user.id },
            data: { paystackSubscriptionCode: sub.subscription_code },
          });

          this.logger.log(
            `Created future trial subscription: ${sub.subscription_code} starting ${trialEndsAt.toISOString()}`,
          );
        } catch (err) {
          this.logger.error(
            `Failed to create future trial subscription for ${user.email}:`,
            err,
          );
        }
      }

      // Fire and forget provisioning
      if (updatedUser.plan?.vemtapPlanId) {
        this.vemtapService
          .provisionUser(
            updatedUser.email,
            updatedUser.firstName,
            updatedUser.lastName,
            updatedUser.plan.vemtapPlanId,
          )
          .catch((err) => {
            this.logger.error(
              `Deferred Vemtap provisioning failed for ${email}:`,
              err,
            );
          });
      }
    } catch (dbError) {
      this.logger.error(`DATABASE UPDATE FAILED for user ${user.email}:`, dbError.stack);
      throw dbError;
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

    const freePlan = await this.prisma.plan.findFirst({
      where: { isDefault: true },
    });

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
