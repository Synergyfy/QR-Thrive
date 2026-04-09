import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as geoip from 'geoip-lite';
import { QRType } from '@prisma/client';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Detects the country code based on the IP address.
   * Defaults to 'US' if detection fails.
   */
  getCountryCodeByIp(ip: string): string {
    if (!ip || ip === '::1' || ip === '127.0.0.1') return 'US';
    const geo = geoip.lookup(ip);
    return geo ? geo.country : 'US';
  }

  /**
   * Fetches the tier and currency info for a specific country.
   */
  async getCountryInfo(code: string) {
    const country = await this.prisma.country.findUnique({
      where: { code },
      include: { tier: true },
    });
    if (!country) return null;
    return country;
  }

  /**
   * Calculates the price for each interval based on the monthly price and system discounts.
   * NOTE: This is now primary used for seeding or bulk updates.
   */
  calculateIntervalPrices(monthlyPrice: number, quarterlyDiscount: number, yearlyDiscount: number) {
    const quarterly = (monthlyPrice * 3) * (1 - quarterlyDiscount / 100);
    const yearly = (monthlyPrice * 12) * (1 - yearlyDiscount / 100);

    return {
      monthly: Number(monthlyPrice.toFixed(2)),
      quarterly: Number(quarterly.toFixed(2)),
      yearly: Number(yearly.toFixed(2)),
    };
  }

  /**
   * Gets all available plans with localized pricing based on the user's IP.
   */
  async getLocalizedPlans(ip: string) {
    const countryCode = this.getCountryCodeByIp(ip);
    const countryInfo = await this.getCountryInfo(countryCode);
    const tierName = countryInfo?.tier?.name || 'High Income';

    const plans = await this.prisma.plan.findMany({
      where: { 
        isActive: true,
        deletedAt: null
      },
      orderBy: { qrCodeLimit: 'asc' },
    });

    return plans.map(plan => {
      let prices = { monthly: 0, quarterly: 0, yearly: 0 };

      if (!plan.isDefault) {
        if (tierName.includes('High')) {
          prices = {
            monthly: plan.highIncomeMonthlyUSD || 0,
            quarterly: plan.highIncomeQuarterlyUSD || 0,
            yearly: plan.highIncomeYearlyUSD || 0,
          };
        } else if (tierName.includes('Middle')) {
          prices = {
            monthly: plan.middleIncomeMonthlyUSD || 0,
            quarterly: plan.middleIncomeQuarterlyUSD || 0,
            yearly: plan.middleIncomeYearlyUSD || 0,
          };
        } else if (tierName.includes('Low')) {
          prices = {
            monthly: plan.lowIncomeMonthlyUSD || 0,
            quarterly: plan.lowIncomeQuarterlyUSD || 0,
            yearly: plan.lowIncomeYearlyUSD || 0,
          };
        }
      }

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        qrCodeLimit: plan.qrCodeLimit,
        qrCodeTypes: plan.qrCodeTypes,
        isPopular: plan.isPopular,
        isDefault: plan.isDefault,
        currency: countryInfo?.currencyCode || 'USD',
        currencySymbol: countryInfo?.currencySymbol || '$',
        pricing: prices,
      };
    });
  }

  /**
   * Fetches a specific plan with localized prices for a given IP.
   */
  async getPlanWithPricing(planId: string, ip: string) {
    const countryCode = this.getCountryCodeByIp(ip);
    const countryInfo = await this.getCountryInfo(countryCode);
    const tierName = countryInfo?.tier?.name || 'High Income';

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    let prices = { monthly: 0, quarterly: 0, yearly: 0 };

    if (!plan.isDefault) {
      if (tierName.includes('High')) {
        prices = {
          monthly: plan.highIncomeMonthlyUSD || 0,
          quarterly: plan.highIncomeQuarterlyUSD || 0,
          yearly: plan.highIncomeYearlyUSD || 0,
        };
      } else if (tierName.includes('Middle')) {
        prices = {
          monthly: plan.middleIncomeMonthlyUSD || 0,
          quarterly: plan.middleIncomeQuarterlyUSD || 0,
          yearly: plan.middleIncomeYearlyUSD || 0,
        };
      } else if (tierName.includes('Low')) {
        prices = {
          monthly: plan.lowIncomeMonthlyUSD || 0,
          quarterly: plan.lowIncomeQuarterlyUSD || 0,
          yearly: plan.lowIncomeYearlyUSD || 0,
        };
      }
    }

    return {
      ...plan,
      currency: countryInfo?.currencyCode || 'USD',
      currencySymbol: countryInfo?.currencySymbol || '$',
      pricing: prices,
    };
  }

  // --- Admin Methods ---

  async getAllTiers() {
    return this.prisma.tier.findMany({
      include: { _count: { select: { countries: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createTier(name: string) {
    const tierCount = await this.prisma.tier.count();
    if (tierCount >= 3) {
      throw new Error('Cannot create more than 3 tiers. Tiers are predefined: High Income, Middle Income, Low Income.');
    }
    return this.prisma.tier.create({ data: { name } });
  }

  async updateTier(id: string, name: string) {
    return this.prisma.tier.update({ where: { id }, data: { name } });
  }

  async deleteTier(id: string) {
    const tier = await this.prisma.tier.findUnique({
      where: { id },
      include: { _count: { select: { countries: true } } },
    });
    if (!tier) throw new NotFoundException('Tier not found');
    if (tier._count.countries > 0) {
      throw new Error(`Cannot delete tier "${tier.name}" because it has ${tier._count.countries} country(ies) assigned. Move the countries first.`);
    }
    return this.prisma.tier.delete({ where: { id } });
  }

  async getAllCountries() {
    return this.prisma.country.findMany({
      include: { tier: true },
      orderBy: { name: 'asc' },
    });
  }

  async upsertCountry(data: any) {
    return this.prisma.country.upsert({
      where: { code: data.code },
      update: data,
      create: data,
    });
  }

  async deleteCountry(code: string) {
    return this.prisma.country.delete({ where: { code } });
  }

  async getPricingConfig() {
    return this.prisma.systemConfig.findFirst({
      select: { quarterlyDiscount: true, yearlyDiscount: true },
    });
  }

  async updatePricingConfig(quarterlyDiscount: number, yearlyDiscount: number) {
    const config = await this.prisma.systemConfig.findFirst();
    if (!config) throw new NotFoundException('System config not found');
    
    return this.prisma.systemConfig.update({
      where: { id: config.id },
      data: { quarterlyDiscount, yearlyDiscount },
    });
  }
}
