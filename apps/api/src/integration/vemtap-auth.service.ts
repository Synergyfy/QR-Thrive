import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface VemtapSubscriptionAssertion {
  planId: string;
  status: string;
  exp: number;
}

@Injectable()
export class VemtapAuthService {
  private readonly logger = new Logger(VemtapAuthService.name);
  private readonly secret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.secret = this.configService.get<string>('VEMTAP_QR_THRIVE_SECRET')!;
  }

  verifyAssertion(token: string): VemtapSubscriptionAssertion {
    if (!this.secret) {
      this.logger.error('VEMTAP_QR_THRIVE_SECRET is not configured');
      throw new UnauthorizedException('Internal authorization error');
    }

    try {
      return this.jwtService.verify(token, {
        secret: this.secret,
      });
    } catch (error) {
      this.logger.warn(`Failed to verify VemTap assertion: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired subscription assertion');
    }
  }
}
