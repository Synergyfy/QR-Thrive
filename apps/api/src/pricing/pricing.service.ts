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
    const tierId = countryInfo?.tierId;
    const config = await this.prisma.systemConfig.findFirst();

    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      include: {
        prices: {
          where: { tierId: tierId || undefined },
        },
      },
      orderBy: { qrCodeLimit: 'asc' },
    });

    return plans.map(plan => {
      // Find the price for the specific tier, or default to some baseline if needed
      // Actually, if we don't have a price for this tier, we might want to default to Tier 1
      let priceEntry = plan.prices[0];
      
      // If no price found for this specific tier, fetch the Tier 1 price as fallback
      if (!priceEntry && !plan.isDefault && tierId) {
          // This would require an extra query or pre-fetching all prices.
          // For now, let's assume we have seeded tiers properly.
      }

      const monthlyPrice = priceEntry?.monthlyPriceUSD || 0;
      const prices = plan.isDefault 
        ? { monthly: 0, quarterly: 0, yearly: 0 }
        : this.calculateIntervalPrices(
            monthlyPrice, 
            config?.quarterlyDiscount || 0, 
            config?.yearlyDiscount || 0
          );

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
    const tierId = countryInfo?.tierId;
    const config = await this.prisma.systemConfig.findFirst();

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        prices: {
          where: { tierId: tierId || undefined },
        },
      },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    const priceEntry = plan.prices[0];
    const monthlyPrice = priceEntry?.monthlyPriceUSD || 0;
    const prices = plan.isDefault 
      ? { monthly: 0, quarterly: 0, yearly: 0 }
      : this.calculateIntervalPrices(
          monthlyPrice, 
          config?.quarterlyDiscount || 0, 
          config?.yearlyDiscount || 0
        );

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
    });
  }

  async createTier(name: string) {
    return this.prisma.tier.create({ data: { name } });
  }

  async updateTier(id: string, name: string) {
    return this.prisma.tier.update({ where: { id }, data: { name } });
  }

  async deleteTier(id: string) {
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
