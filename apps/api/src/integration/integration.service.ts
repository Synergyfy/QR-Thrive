import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationUserDto } from './dto/integration.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async ensureUser(dto: IntegrationUserDto) {
    const { email, firstName, lastName } = dto;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Logic for default plan
      const defaultPlan = await this.prisma.plan.findFirst({
        where: { isDefault: true, isActive: true, deletedAt: null },
      });

      const planData: any = {};
      if (defaultPlan) {
        planData.planId = defaultPlan.id;
        if (defaultPlan.isFree) {
          planData.subscriptionStatus = 'active';
        } else if (defaultPlan.trialDays > 0) {
          const now = new Date();
          const trialEndsAt = new Date();
          trialEndsAt.setDate(now.getDate() + defaultPlan.trialDays);
          planData.trialStartedAt = now;
          planData.trialEndsAt = trialEndsAt;
          planData.subscriptionStatus = 'trialing';
        }
      }

      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role: 'USER',
          ...planData,
        },
      });
      this.logger.log(`Integration: Created new user for ${email}`);
    }

    return user;
  }

  async generateMagicLink(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.authService.generateMagicLink(userId);
  }

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        isFree: true,
      },
    });
  }

  async setUserSubscription(userId: string, planId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const planData: any = {
      planId: plan.id,
      subscriptionStatus: 'active',
    };

    if (!plan.isFree) {
      // For paid plans coming from integration, we assume payment is handled by the caller (VemTap)
      // We set status to active and clear trial data
      planData.trialStartedAt = null;
      planData.trialEndsAt = null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: planData,
    });
  }
}
