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
} from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { PrismaService } from '../prisma/prisma.service';
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
  ) {}

  @Post('initialize')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initialize a Paystack transaction for subscription' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 5000, description: 'Amount in kobo/lowest currency unit' },
        planCode: { type: 'string', example: 'PLN_123456', description: 'Optional Paystack plan code' },
      },
      required: ['amount'],
    },
  })
  @ApiResponse({ status: 200, description: 'Transaction initialized successfully.' })
  @ApiResponse({ status: 400, description: 'User not found or invalid input.' })
  async initialize(
    @Req() req: { user: { userId: string } },
    @Body() body: { amount: number; planCode?: string },
  ) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.paystackService.initializeTransaction(
      user.email,
      body.amount,
      body.planCode,
      { userId: user.id },
    );
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'PRO',
        paystackCustomerCode: customer.customer_code,
        paystackSubscriptionCode: subscription?.subscription_code || null,
        subscriptionStatus: 'active',
        billingCycle: plan?.interval || null,
      },
    });

    this.logger.log(`User ${email} upgraded to PRO`);
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'FREE',
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
