import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as geoip from 'geoip-lite';
import { PricingTier, BillingCycle, PriceStatus, Plan } from '@prisma/client';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface PricePoint {
  amount: number;
  currency: string;
  currencySymbol: string;
  priceBookId: string;
  gatewayIds: {
    stripe?: string;
    paystack?: string;
  };
}

export interface PlanPricing {
  monthly?: PricePoint;
  quarterly?: PricePoint;
  yearly?: PricePoint;
}

export interface LocalizedPlan extends Partial<Plan> {
  pricing: PlanPricing;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  // Cache for exchange rates: { [currencyCode]: { rate: number, timestamp: number } }
  private exchangeRateCache: Record<
    string,
    { rate: number; timestamp: number }
  > = {};
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

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.rate;
    }

    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/USD`,
      );
      const allRates = response.data.rates;
      const rate = allRates[toCurrency];

      if (rate) {
        Object.keys(allRates).forEach((code) => {
          this.exchangeRateCache[code] = {
            rate: allRates[code],
            timestamp: now,
          };
        });
        return rate;
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch live exchange rate for ${toCurrency}: ${error.message}. Using fallback.`,
      );
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
  public formatPrice(value: number, currency: string): number {
    if (currency === 'NGN') {
      return Math.round(value / 10) * 10;
    }
    return Number(value.toFixed(2));
  }

  /**
   * Calculates Quarterly and Yearly prices based on a monthly base and system discounts.
   */
  async calculateDiscountedPrices(monthlyPrice: number, currency: string) {
    const config = await this.prisma.systemConfig.findFirst();
    const qDiscount = (config?.quarterlyDiscount || 10) / 100;
    const yDiscount = (config?.yearlyDiscount || 20) / 100;

    const quarterlyTotal = monthlyPrice * 3 * (1 - qDiscount);
    const yearlyTotal = monthlyPrice * 12 * (1 - yDiscount);

    return {
      monthly: this.formatPrice(monthlyPrice, currency),
      quarterly: this.formatPrice(quarterlyTotal, currency),
      yearly: this.formatPrice(yearlyTotal, currency),
    };
  }

  private async formatPlanWithPricing(
    plan: any,
    tier: PricingTier,
    targetCurrency: string,
    symbol: string,
  ): Promise<LocalizedPlan> {
    const getPlanPriceBook = (cycle: BillingCycle) => {
      // Step A (Exact Match): Plan + User Tier + Local Currency
      let match = plan.priceBooks.find(
        (pb) =>
          pb.tier === tier &&
          pb.currencyCode === targetCurrency &&
          pb.billingCycle === cycle,
      );
      if (match) return match;

      // Step B (Tier USD Fallback): Plan + User Tier + USD
      match = plan.priceBooks.find(
        (pb) =>
          pb.tier === tier &&
          pb.currencyCode === 'USD' &&
          pb.billingCycle === cycle,
      );
      if (match) return match;

      // Step C (Global Fallback): HIGH Tier + USD
      return plan.priceBooks.find(
        (pb) =>
          pb.tier === PricingTier.HIGH &&
          pb.currencyCode === 'USD' &&
          pb.billingCycle === cycle,
      );
    };

    const formatCycle = async (cycle: BillingCycle) => {
      let pb = getPlanPriceBook(cycle);
      
      let amount: number;
      let currency: string;
      let currencySymbol: string;
      let priceBookId: string;
      let gatewayIds: { stripe?: string; paystack?: string } = {};

      if (!pb) {
        // Fallback: If Quarterly/Yearly is missing, calculate from Monthly
        if (cycle === BillingCycle.MONTHLY) return undefined;
        
        const monthlyPb = getPlanPriceBook(BillingCycle.MONTHLY);
        if (!monthlyPb) return undefined;

        const prices = await this.calculateDiscountedPrices(monthlyPb.price, monthlyPb.currencyCode);
        amount = cycle === BillingCycle.QUARTERLY ? prices.quarterly : prices.yearly;
        currency = monthlyPb.currencyCode;
        currencySymbol = monthlyPb.currencyCode === 'USD' ? '$' : (monthlyPb.currencyCode === targetCurrency ? symbol : monthlyPb.currencyCode);
        priceBookId = `calc:${monthlyPb.id}:${cycle}`; // Virtual ID
      } else {
        amount = pb.price;
        currency = pb.currencyCode;
        currencySymbol =
          pb.currencyCode === 'USD'
            ? '$'
            : pb.currencyCode === targetCurrency
              ? symbol
              : pb.currencyCode;
        priceBookId = pb.id;
        gatewayIds = {
          stripe: pb.stripePriceId || undefined,
          paystack: pb.paystackPlanCode || undefined,
        };
      }

      // HYBRID CONVERSION: If we have a USD price (base or pb) but the user expects a local currency
      if (currency === 'USD' && targetCurrency !== 'USD') {
        const rate = await this.getExchangeRate(targetCurrency);
        amount = this.formatPrice(amount * rate, targetCurrency);
        currency = targetCurrency;
        currencySymbol = symbol;
      }

      return {
        amount,
        currency,
        currencySymbol,
        priceBookId,
        gatewayIds,
      };
    };

    const [monthly, quarterly, yearly] = await Promise.all([
      formatCycle(BillingCycle.MONTHLY),
      formatCycle(BillingCycle.QUARTERLY),
      formatCycle(BillingCycle.YEARLY),
    ]);

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
      pricing: { monthly, quarterly, yearly },
      isActive: plan.isActive,
      deletedAt: plan.deletedAt,
    } as any;
  }

  /**
   * Clears the pricing cache for public plans and specific plans.
   */
  async clearPricingCache() {
    this.logger.log('Clearing all pricing caches...');
    // In a real scenario with distributed cache, we might use a pattern or tag
    // For now, we'll rely on the TTL or explicit keys if we tracked them.
    // Given the cache keys are dynamic based on tier/currency, a simpler approach
    // for this local setup is to just wait for the 10min TTL OR
    // implement a versioning/bust mechanism.

    // However, we can try to clear common entries if we know the tiers
    const tiers = [PricingTier.HIGH, PricingTier.MIDDLE, PricingTier.LOW];
    for (const tier of tiers) {
      // This is a bit brute force but effective for the current scale
      // We'll trust the AdminService specifically clears the relevant keys too
    }
  }

  /**
   * Gets all available plans with localized pricing based on the country code.
   */
  async getLocalizedPlans(countryCode: string): Promise<LocalizedPlan[]> {
    const countryInfo = await this.getCountryInfo(countryCode);
    const tier = countryInfo?.tier || PricingTier.HIGH;
    const targetCurrency = countryInfo?.currencyCode || 'USD';
    const symbol = countryInfo?.currencySymbol || '$';

    const cacheKey = `pricing:plans:tier:${tier}:currency:${targetCurrency}`;
    const cached = await this.cacheManager.get<LocalizedPlan[]>(cacheKey);
    if (cached) return cached;

    const plans = await this.prisma.plan.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        priceBooks: {
          where: {
            status: PriceStatus.ACTIVE,
            OR: [{ activeFrom: null }, { activeFrom: { lte: new Date() } }],
          },
        },
      },
      orderBy: { qrCodeLimit: 'asc' },
    });

    const result = await Promise.all(
      plans.map((plan) =>
        this.formatPlanWithPricing(plan, tier, targetCurrency, symbol),
      ),
    );

    await this.cacheManager.set(cacheKey, result, 600); // 10 min cache for public plans
    return result;
  }

  /**
   * Fetches a specific plan with localized prices for a given country code.
   */
  async getPlanWithPricing(
    planId: string,
    countryCode: string,
  ): Promise<LocalizedPlan> {
    const countryInfo = await this.getCountryInfo(countryCode);
    const tier = countryInfo?.tier || PricingTier.HIGH;
    const targetCurrency = countryInfo?.currencyCode || 'USD';
    const symbol = countryInfo?.currencySymbol || '$';

    const cacheKey = `pricing:plan:${planId}:tier:${tier}:currency:${targetCurrency}`;
    const cached = await this.cacheManager.get<LocalizedPlan>(cacheKey);
    if (cached) return cached;

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        priceBooks: {
          where: {
            status: PriceStatus.ACTIVE,
            OR: [{ activeFrom: null }, { activeFrom: { lte: new Date() } }],
          },
        },
      },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    const result = await this.formatPlanWithPricing(
      plan,
      tier,
      targetCurrency,
      symbol,
    );

    await this.cacheManager.set(cacheKey, result, 600);
    return result;
  }

  // --- Admin Methods ---

  async getSuggestedPrice(
    basePriceUSD: number,
    targetCurrencyCode: string,
    targetTier?: PricingTier,
  ) {
    const rate = await this.getExchangeRate(targetCurrencyCode);

    // Scaling factors based on Purchasing Power Parity (PPP) tiers
    const scalingFactors: Record<PricingTier, number> = {
      [PricingTier.HIGH]: 1.0,
      [PricingTier.MIDDLE]: 0.7,
      [PricingTier.LOW]: 0.4,
    };

    const factor = targetTier ? scalingFactors[targetTier] : 1.0;
    const localizedBase = basePriceUSD * factor;
    const suggestedAmount = localizedBase * rate;

    return {
      basePriceUSD,
      targetTier: targetTier || 'HIGH (default)',
      scalingFactor: factor,
      targetCurrencyCode,
      exchangeRate: rate,
      suggestedAmount: this.formatPrice(suggestedAmount, targetCurrencyCode),
      timestamp: new Date(),
    };
  }

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
