import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VemtapService {
  private readonly logger = new Logger(VemtapService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('VEMTAP_API_URL') || '';
    this.apiKey = this.configService.get<string>('VEMTAP_API_KEY') || '';

    if (!this.baseUrl || !this.apiKey) {
      this.logger.warn(
        'VEMTAP_API_URL or VEMTAP_API_KEY is not defined. Integration features will be limited.',
      );
    }
  }

  private get headers() {
    return {
      'X-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetches all active plans from Vemtap.
   */
  async fetchActivePlans() {
    if (!this.baseUrl) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/plans?onlyActive=true`, {
          headers: this.headers,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to fetch plans from Vemtap:',
        error.response?.data || error.message,
      );
      return [];
    }
  }

  /**
   * Provisions a user on Vemtap with a specific plan.
   */
  async provisionUser(
    email: string,
    firstName: string,
    lastName: string,
    vemtapPlanId: string,
  ) {
    if (!this.baseUrl) return;

    try {
      this.logger.log(`Provisioning user ${email} on Vemtap with plan ${vemtapPlanId}...`);
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/provision`,
          {
            email,
            firstName,
            lastName,
            planId: vemtapPlanId,
          },
          { headers: this.headers },
        ),
      );

      this.logger.log(`Successfully provisioned user ${email} on Vemtap.`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to provision user ${email} on Vemtap:`,
        error.response?.data || error.message,
      );
      // We don't throw here to avoid failing the QR-Thrive payment flow, 
      // but in production we might want a retry queue.
    }
  }
}
