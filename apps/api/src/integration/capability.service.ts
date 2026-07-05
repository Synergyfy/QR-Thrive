import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
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

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getCapabilities(planId: string): Promise<PlanCapabilities> {
    const cacheKey = `capability:plan:${planId}`;
    const cached = await this.cacheManager.get<PlanCapabilities>(cacheKey);
    if (cached) return cached;

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

      const caps = this.mapPlanToCapabilities(freePlan);
      await this.cacheManager.set(cacheKey, caps, 300);
      return caps;
    }

    const caps = this.mapPlanToCapabilities(plan);
    await this.cacheManager.set(cacheKey, caps, 300);
    return caps;
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