import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const qrType = request.body.type;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // Fetch user with their plan
    const userWithPlan = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        plan: true,
      },
    });

    if (!userWithPlan || !userWithPlan.plan) {
      throw new ForbiddenException('User has no active plan assigned');
    }

    const { plan } = userWithPlan;

    // 1. Check QR Type allowed
    if (qrType && !plan.qrCodeTypes.includes(qrType)) {
      throw new ForbiddenException(
        `Your current plan (${plan.name}) does not support ${qrType} QR codes.`,
      );
    }

    // 2. Check Usage Limit
    const activeQRsCount = await this.prisma.qRCode.count({
      where: {
        userId: user.userId,
        deletedAt: null, // Only count non-deleted QRs
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
