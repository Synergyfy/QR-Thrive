import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CapabilityService } from '../integration/capability.service';
import type { Request } from 'express';
import type { VemTapSubscriptionPayload } from '../integration/vemtap-subscription.guard';

@Injectable()
export class UsageGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly capabilityService: CapabilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const qrType = request.body?.type;

    const vemtapSubscription = request.vemtapSubscription as VemTapSubscriptionPayload | undefined;

    if (vemtapSubscription) {
      return this.handleVemTapSubscription(request, vemtapSubscription, qrType);
    }

    return this.handleNativeAuth(request, user, qrType);
  }

  private async handleVemTapSubscription(
    request: Request,
    vemtapSubscription: VemTapSubscriptionPayload,
    qrType?: string,
  ): Promise<boolean> {
    const { planCapabilities, qrThrivePlanId } = vemtapSubscription;

    if (qrType && planCapabilities.allowedQRTypes) {
      if (!planCapabilities.allowedQRTypes.includes(qrType)) {
        throw new ForbiddenException(
          `Your current plan does not support ${qrType} QR codes.`,
        );
      }
    }

    const userId = vemtapSubscription.sub;
    const activeQRsCount = await this.prisma.qRCode.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    const limit = planCapabilities.qrCodeLimit || 10;
    if (activeQRsCount >= limit) {
      throw new ForbiddenException(
        `You have reached your limit of ${limit} QR codes. Please upgrade your plan.`,
      );
    }

    return true;
  }

  private async handleNativeAuth(request: Request, user: any, qrType?: string): Promise<boolean> {
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const userWithPlan = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        plan: true,
      },
    });

    if (!userWithPlan || !userWithPlan.plan) {
      throw new ForbiddenException('User has no active plan assigned');
    }

    // Attach the full user to request so downstream services don't re-fetch
    (request as any).__userWithPlan = userWithPlan;

    const { plan } = userWithPlan;

    if (qrType && !plan.qrCodeTypes.includes(qrType as any)) {
      throw new ForbiddenException(
        `Your current plan (${plan.name}) does not support ${qrType} QR codes.`,
      );
    }

    const activeQRsCount = await this.prisma.qRCode.count({
      where: {
        userId: user.userId,
        deletedAt: null,
      },
    });

    if (activeQRsCount >= plan.qrCodeLimit) {
      throw new ForbiddenException(
        `You have reached your limit of ${plan.qrCodeLimit} QR codes. Please upgrade your plan.`,
      );
    }

    return true;
  }
}
