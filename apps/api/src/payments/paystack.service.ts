import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.secretKey =
      this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    if (!this.secretKey) {
      this.logger.error(
        'PAYSTACK_SECRET_KEY is not defined in environment variables',
      );
    }
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeTransaction(
    email: string,
    amount: number,
    plan?: string,
    metadata?: any,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transaction/initialize`,
          {
            email,
            amount: amount * 100, // Convert to kobo
            plan,
            metadata,
            callback_url: `${this.configService.get('FRONTEND_URL')}/dashboard/billing`,
          },
          { headers: this.headers },
        ),
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        'Paystack initialize error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Error initializing Paystack transaction',
      );
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/transaction/verify/${reference}`,
          {
            headers: this.headers,
          },
        ),
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        'Paystack verify error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Error verifying Paystack transaction',
      );
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  async createPlan(
    name: string,
    amount: number,
    interval: 'monthly' | 'quarterly' | 'annually',
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/plan`,
          {
            name,
            amount: amount * 100,
            interval,
          },
          { headers: this.headers },
        ),
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        'Paystack plan creation error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Error creating Paystack plan');
    }
  }

  async updatePlan(planCode: string, name: string, amount: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.baseUrl}/plan/${planCode}`,
          {
            name,
            amount: amount * 100,
          },
          { headers: this.headers },
        ),
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        'Paystack plan update error:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Error updating Paystack plan');
    }
  }
}
