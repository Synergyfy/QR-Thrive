import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan, QRType } from '@prisma/client';

export interface PlanCapabilities {
  qrCodeLimit: number;
  allowedQRTypes: QRType[];
  canCreateQR: boolean;
  canScan: boolean;
  canAnalytics: boolean;
}

@Injectable()
export class CapabilityService {
  private readonly logger = new Logger(CapabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCapabilities(planId: string): Promise<PlanCapabilities> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      this.logger.warn(`Plan not found: ${planId}, falling back to free plan`);
      const freePlan = await this.prisma.plan.findFirst({
        where: { isFree: true, isActive: true },
      });

      if (!freePlan) {
        this.logger.error('No free plan found, defaulting to minimal capabilities');
        return this.getDefaultCapabilities();
      }

      return this.mapPlanToCapabilities(freePlan);
    }

    return this.mapPlanToCapabilities(plan);
  }

  async checkCreatePermission(planId: string, qrType: QRType): Promise<boolean> {
    const capabilities = await this.getCapabilities(planId);

    if (!capabilities.canCreateQR) {
      return false;
    }

    if (!capabilities.allowedQRTypes.includes(qrType)) {
      return false;
    }

    return true;
  }

  async checkQRLimit(planId: string, currentCount: number): Promise<boolean> {
    const capabilities = await this.getCapabilities(planId);
    // -1 means unlimited
    if (capabilities.qrCodeLimit === -1) {
      return true;
    }
    return currentCount < capabilities.qrCodeLimit;
  }

  async checkScanPermission(planId: string): Promise<boolean> {
    const capabilities = await this.getCapabilities(planId);
    return capabilities.canScan;
  }

  async checkAnalyticsPermission(planId: string): Promise<boolean> {
    const capabilities = await this.getCapabilities(planId);
    return capabilities.canAnalytics;
  }

  private mapPlanToCapabilities(plan: Plan): PlanCapabilities {
    const features = plan.features || [];
    const hasAnalyticsFeature = features.includes('analytics') || features.includes('advanced-analytics');

    return {
      qrCodeLimit: plan.qrCodeLimit,
      allowedQRTypes: plan.qrCodeTypes as QRType[],
      canCreateQR: true,
      canScan: true,
      canAnalytics: hasAnalyticsFeature,
    };
  }

  private getDefaultCapabilities(): PlanCapabilities {
    return {
      qrCodeLimit: 10,
      allowedQRTypes: [QRType.url, QRType.text],
      canCreateQR: true,
      canScan: true,
      canAnalytics: false,
    };
  }
}