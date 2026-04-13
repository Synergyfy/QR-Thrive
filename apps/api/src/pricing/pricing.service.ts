import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as geoip from 'geoip-lite';
import { QRType, PricingTier } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  
  // Cache for exchange rates: { [currencyCode]: { rate: number, timestamp: number } }
  private exchangeRateCache: Record<string, { rate: number; timestamp: number }> = {};
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(private prisma: PrismaService) {}

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
          tier: PricingTier.LOW
        };
      }
      return {
        code,
        name: 'Global',
        currencyCode: 'USD',
        currencySymbol: '$',
        tier: PricingTier.HIGH
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
   * Gets all available plans with localized pricing based on the user's IP.
   */
  async getLocalizedPlans(ip: string) {
    const countryCode = this.getCountryCodeByIp(ip);
    const countryInfo = await this.getCountryInfo(countryCode);
    const tier = countryInfo?.tier || PricingTier.HIGH;
    const currency = countryInfo?.currencyCode || 'USD';
    const symbol = countryInfo?.currencySymbol || '$';

    const exchangeRate = await this.getExchangeRate(currency);

    const plans = await this.prisma.plan.findMany({
      where: { 
        isActive: true,
        deletedAt: null
      },
      orderBy: { qrCodeLimit: 'asc' },
    });

    return plans.map(plan => {
      // Tier selection with fallback to high income if tier-specific price is missing
      const selectPrice = (t: PricingTier) => {
        if (t === PricingTier.LOW && plan.lowIncomeMonthlyUSD) {
          return { m: plan.lowIncomeMonthlyUSD, q: plan.lowIncomeQuarterlyUSD, y: plan.lowIncomeYearlyUSD };
        }
        if (t === PricingTier.MIDDLE && plan.middleIncomeMonthlyUSD) {
          return { m: plan.middleIncomeMonthlyUSD, q: plan.middleIncomeQuarterlyUSD, y: plan.middleIncomeYearlyUSD };
        }
        return { m: plan.highIncomeMonthlyUSD, q: plan.highIncomeQuarterlyUSD, y: plan.highIncomeYearlyUSD };
      };

      const selected = selectPrice(tier);

      const pricing = {
        monthly: this.formatPrice(selected.m * exchangeRate, currency),
        quarterly: this.formatPrice(selected.q * exchangeRate, currency),
        yearly: this.formatPrice(selected.y * exchangeRate, currency),
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
        currency,
        currencySymbol: symbol,
        pricing,
      };
    });
  }

  /**
   * Fetches a specific plan with localized prices for a given IP.
   */
  async getPlanWithPricing(planId: string, ip: string) {
    const countryCode = this.getCountryCodeByIp(ip);
    const countryInfo = await this.getCountryInfo(countryCode);
    const tier = countryInfo?.tier || PricingTier.HIGH;
    const currency = countryInfo?.currencyCode || 'USD';
    const symbol = countryInfo?.currencySymbol || '$';

    const exchangeRate = await this.getExchangeRate(currency);

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    const selectPrice = (t: PricingTier) => {
      if (t === PricingTier.LOW && plan.lowIncomeMonthlyUSD) {
        return { m: plan.lowIncomeMonthlyUSD, q: plan.lowIncomeQuarterlyUSD, y: plan.lowIncomeYearlyUSD };
      }
      if (t === PricingTier.MIDDLE && plan.middleIncomeMonthlyUSD) {
        return { m: plan.middleIncomeMonthlyUSD, q: plan.middleIncomeQuarterlyUSD, y: plan.middleIncomeYearlyUSD };
      }
      return { m: plan.highIncomeMonthlyUSD, q: plan.highIncomeQuarterlyUSD, y: plan.highIncomeYearlyUSD };
    };

    const selected = selectPrice(tier);

    const pricing = {
      monthly: this.formatPrice(selected.m * exchangeRate, currency),
      quarterly: this.formatPrice(selected.q * exchangeRate, currency),
      yearly: this.formatPrice(selected.y * exchangeRate, currency),
    };

    return {
      ...plan,
      currency,
      currencySymbol: symbol,
      pricing,
    };
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
