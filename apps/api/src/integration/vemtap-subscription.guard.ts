import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface VemTapSubscriptionPayload {
  sub: string;
  businessId: string;
  subscriptionStatus: 'active' | 'trial' | 'expired';
  qrThrivePlanId: string;
  planCapabilities: {
    qrCodeLimit: number;
    allowedQRTypes: string[];
    canScan: boolean;
    canAnalytics: boolean;
  };
  exp: number;
  iat: number;
}

declare global {
  namespace Express {
    interface Request {
      vemtapSubscription?: VemTapSubscriptionPayload;
    }
  }
}

@Injectable()
export class VemTapSubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(VemTapSubscriptionGuard.name);
  private readonly secret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.secret = this.configService.get<string>('VEMTAP_QR_THRIVE_SECRET') || '';
    if (!this.secret) {
      this.logger.warn('VEMTAP_QR_THRIVE_SECRET is not configured');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-vemtap-subscription-token'] as string;

    if (!token) {
      this.logger.debug('No VemTap subscription token found, falling through to existing auth');
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync<VemTapSubscriptionPayload>(token, {
        secret: this.secret,
      });

      if (payload.subscriptionStatus === 'expired') {
        throw new UnauthorizedException('VemTap subscription has expired');
      }

      if (payload.subscriptionStatus !== 'active' && payload.subscriptionStatus !== 'trial') {
        throw new UnauthorizedException('Invalid VemTap subscription status');
      }

      request.vemtapSubscription = payload;
      this.logger.debug(`VemTap subscription token validated for user ${payload.sub}`);
      return true;
    } catch (error) {
      this.logger.warn(`VemTap subscription token validation failed: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired VemTap subscription token');
    }
  }
}