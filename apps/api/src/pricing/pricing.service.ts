import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as geoip from 'geoip-lite';
import { PricingTier, BillingCycle, PriceStatus, Plan } from '@prisma/client';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface PlanPricing {
  monthly: number;
  quarterly: number;
  yearly: number;
}

export interface LocalizedPlan extends Partial<Plan> {
  currency: string;
  currencySymbol: string;
  taxRate: number;
  pricing: PlanPricing;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  
  // Cache for exchange rates: { [currencyCode]: { rate: number, timestamp: number } }
  private exchangeRateCache: Record<string, { rate: number; timestamp: number }> = {};
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Fetches the exchange rate for a given currency vs USD.
   */
  private async getExchangeRate(toCurrency: string): Promise<number> {
    if (toCurrency === 'USD') return 1.0;

    const now = Date.now();
    const cached = this.exchangeRateCache[toCurrency];

    if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
      return cached.rate;
    }

    try {
      const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);
      const allRates = response.data.rates;
      const rate = allRates[toCurrency];
      
      if (rate) {
        Object.keys(allRates).forEach(code => {
          this.exchangeRateCache[code] = { rate: allRates[code], timestamp: now };
        });
        return rate;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch live exchange rate for ${toCurrency}: ${error.message}. Using fallback.`);
      if (toCurrency === 'NGN') return 1400; 
      if (toCurrency === 'EUR') return 0.92;
      if (toCurrency === 'GBP') return 0.78;
    }

    return cached?.rate || 1.0;
  }

  /**
   * Detects the country code based on the IP address.
   */
  getCountryCodeByIp(ip: string): string {
    if (!ip || ip === '::1' || ip === '127.0.0.1') return 'NG';
    try {
      const geo = geoip.lookup(ip);
      return geo ? geo.country : 'NG';
    } catch (err) {
      return 'NG';
    }
  }

  /**
   * Fetches the tier and currency info for a specific country.
   */
  async getCountryInfo(code: string) {
    const country = await this.prisma.country.findUnique({
      where: { code },
    });
    
    // Fallback if country is not in database
    if (!country) {
      if (code === 'NG') {
        return {
          code: 'NG',
          name: 'Nigeria',
          currencyCode: 'NGN',
          currencySymbol: '₦',
          tier: PricingTier.LOW,
          taxRate: 0,
        };
      }
      return {
        code,
        name: 'Global',
        currencyCode: 'USD',
        currencySymbol: '$',
        tier: PricingTier.HIGH,
        taxRate: 0,
      };
    }
    return country;
  }

  /**
   * Utility to round prices based on currency context.
   */
  private formatPrice(value: number, currency: string): number {
    if (currency === 'NGN') {
      return Math.round(value / 10) * 10;
    }
    return Number(value.toFixed(2));
  }

  /**
   * Gets all available plans with localized pricing based on the country code.
   */
  async getLocalizedPlans(countryCode: string): Promise<LocalizedPlan[]> {
    const countryInfo = await this.getCountryInfo(countryCode);
    const tier = countryInfo?.tier || PricingTier.HIGH;
    const targetCurrency = countryInfo?.currencyCode || 'USD';
    const symbol = countryInfo?.currencySymbol || '$';
    const taxRate = countryInfo?.taxRate || 0;

    const cacheKey = `pricing:plans:tier:${tier}:currency:${targetCurrency}`;
    const cached = await this.cacheManager.get<LocalizedPlan[]>(cacheKey);
    if (cached) return cached;

    const plans = await this.prisma.plan.findMany({
      where: { 
        isActive: true,
        deletedAt: null
      },
      include: {
        priceBooks: {
          where: {
            status: PriceStatus.ACTIVE,
            OR: [
              { activeFrom: null },
              { activeFrom: { lte: new Date() } }
            ],
          }
        }
      },
      orderBy: { qrCodeLimit: 'asc' },
    });

    const result: LocalizedPlan[] = plans.map(plan => {
      const getPlanPrice = (cycle: BillingCycle) => {
        // 1. Try exact Tier + Currency match
        let priceEntry = plan.priceBooks.find(pb => pb.tier === tier && pb.currencyCode === targetCurrency && pb.billingCycle === cycle);
        
        // 2. Fallback to Tier + USD (and use exchange rate)
        if (!priceEntry && targetCurrency !== 'USD') {
          priceEntry = plan.priceBooks.find(pb => pb.tier === tier && pb.currencyCode === 'USD' && pb.billingCycle === cycle);
        }

        // 3. Last fallback: HIGH Tier + USD
        if (!priceEntry) {
          priceEntry = plan.priceBooks.find(pb => pb.tier === PricingTier.HIGH && pb.currencyCode === 'USD' && pb.billingCycle === cycle);
        }

        return priceEntry ? priceEntry.price : 0;
      };

      const pricing: PlanPricing = {
        monthly: this.formatPrice(getPlanPrice(BillingCycle.MONTHLY), targetCurrency),
        quarterly: this.formatPrice(getPlanPrice(BillingCycle.QUARTERLY), targetCurrency),
        yearly: this.formatPrice(getPlanPrice(BillingCycle.YEARLY), targetCurrency),
      };

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        qrCodeLimit: plan.qrCodeLimit,
        qrCodeTypes: plan.qrCodeTypes,
        isPopular: plan.isPopular,
        isDefault: plan.isDefault,
        isFree: plan.isFree,
        trialDays: plan.trialDays,
        vemtapPlanId: plan.vemtapPlanId,
        currency: targetCurrency,
        currencySymbol: symbol,
        taxRate,
        pricing,
      };
    });

    await this.cacheManager.set(cacheKey, result, 3600);
    return result;
  }

  /**
   * Fetches a specific plan with localized prices for a given country code.
   */
  async getPlanWithPricing(planId: string, countryCode: string): Promise<LocalizedPlan> {
    const countryInfo = await this.getCountryInfo(countryCode);
    const tier = countryInfo?.tier || PricingTier.HIGH;
    const targetCurrency = countryInfo?.currencyCode || 'USD';
    const symbol = countryInfo?.currencySymbol || '$';
    const taxRate = countryInfo?.taxRate || 0;

    const cacheKey = `pricing:plan:${planId}:tier:${tier}:currency:${targetCurrency}`;
    const cached = await this.cacheManager.get<LocalizedPlan>(cacheKey);
    if (cached) return cached;

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        priceBooks: {
          where: {
            status: PriceStatus.ACTIVE,
            OR: [
              { activeFrom: null },
              { activeFrom: { lte: new Date() } }
            ]
          }
        }
      }
    });

    if (!plan) throw new NotFoundException('Plan not found');

    const getPlanPrice = (cycle: BillingCycle) => {
      let priceEntry = plan.priceBooks.find(pb => pb.tier === tier && pb.currencyCode === targetCurrency && pb.billingCycle === cycle);
      if (!priceEntry && targetCurrency !== 'USD') {
        priceEntry = plan.priceBooks.find(pb => pb.tier === tier && pb.currencyCode === 'USD' && pb.billingCycle === cycle);
      }
      if (!priceEntry) {
        priceEntry = plan.priceBooks.find(pb => pb.tier === PricingTier.HIGH && pb.currencyCode === 'USD' && pb.billingCycle === cycle);
      }
      return priceEntry ? priceEntry.price : 0;
    };

    const pricing: PlanPricing = {
      monthly: this.formatPrice(getPlanPrice(BillingCycle.MONTHLY), targetCurrency),
      quarterly: this.formatPrice(getPlanPrice(BillingCycle.QUARTERLY), targetCurrency),
      yearly: this.formatPrice(getPlanPrice(BillingCycle.YEARLY), targetCurrency),
    };

    const result: LocalizedPlan = {
      ...plan,
      currency: targetCurrency,
      currencySymbol: symbol,
      taxRate,
      pricing,
    };

    await this.cacheManager.set(cacheKey, result, 3600);
    return result;
  }

  // --- Admin Methods ---

  async getAllCountries() {
    return this.prisma.country.findMany({
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
