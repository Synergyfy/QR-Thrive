import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as geoip from 'geoip-lite';
import { QRType } from '@prisma/client';
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
   * Uses exchangerate-api.com (v4) which has broader currency support (including NGN) and is keyless.
   */
  private async getExchangeRate(toCurrency: string): Promise<number> {
    if (toCurrency === 'USD') return 1.0;

    const now = Date.now();
    const cached = this.exchangeRateCache[toCurrency];

    if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
      return cached.rate;
    }

    try {
      // exchangerate-api.com v4 is free, keyless and supports NGN
      const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);
      const allRates = response.data.rates;
      const rate = allRates[toCurrency];
      
      if (rate) {
        // Update cache for all fetched rates while we're at it
        Object.keys(allRates).forEach(code => {
          this.exchangeRateCache[code] = { rate: allRates[code], timestamp: now };
        });
        return rate;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch live exchange rate for ${toCurrency}: ${error.message}. Using hardcoded fallback.`);
      
      // Hardcoded last-resort fallbacks
      if (toCurrency === 'NGN') return 1400; 
      if (toCurrency === 'EUR') return 0.92;
      if (toCurrency === 'GBP') return 0.78;
    }

    return cached?.rate || 1.0;
  }

  /**
   * Detects the country code based on the IP address.
   * Defaults to 'NG' if detection fails.
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
      include: { tier: true },
    });
    
    // Fallback if country is not in database
    if (!country) {
      // If it's Nigeria, we still want NGN currency info
      if (code === 'NG') {
        return {
          code: 'NG',
          name: 'Nigeria',
          currencyCode: 'NGN',
          currencySymbol: '₦',
          tier: { name: 'High Income' } // Defaulting to High Income as standard baseline
        };
      }
      return {
        code,
        name: 'Global',
        currencyCode: 'USD',
        currencySymbol: '$',
        tier: { name: 'High Income' }
      };
    }
    return country;
  }

  /**
   * Utility to round prices based on currency context.
   */
  private formatPrice(value: number, currency: string): number {
    if (currency === 'NGN') {
      // Round to nearest 10 for cleaner display (optional, but professional)
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
    const tierName = (countryInfo?.tier?.name || 'High Income').toLowerCase();
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
      let monthlyUSD = 0;
      let quarterlyUSD = 0;
      let yearlyUSD = 0;

      // Tier selection with smart fallback (if a tier value is 0, try higher tiers)
      const tryTier = (tier: 'low' | 'middle' | 'high') => {
        if (tier === 'low' && plan.lowIncomeMonthlyUSD) {
          return { m: plan.lowIncomeMonthlyUSD, q: plan.lowIncomeQuarterlyUSD, y: plan.lowIncomeYearlyUSD };
        }
        if (tier === 'middle' && plan.middleIncomeMonthlyUSD) {
          return { m: plan.middleIncomeMonthlyUSD, q: plan.middleIncomeQuarterlyUSD, y: plan.middleIncomeYearlyUSD };
        }
        return { m: plan.highIncomeMonthlyUSD, q: plan.highIncomeQuarterlyUSD, y: plan.highIncomeYearlyUSD };
      };

      let selected;
      if (tierName.includes('low')) selected = tryTier('low');
      else if (tierName.includes('middle')) selected = tryTier('middle');
      else selected = tryTier('high');

      monthlyUSD = selected.m || 0;
      quarterlyUSD = selected.q || 0;
      yearlyUSD = selected.y || 0;

      // Apply currency conversion and formatting
      const pricing = {
        monthly: this.formatPrice(monthlyUSD * exchangeRate, currency),
        quarterly: this.formatPrice(quarterlyUSD * exchangeRate, currency),
        yearly: this.formatPrice(yearlyUSD * exchangeRate, currency),
      };

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        qrCodeLimit: plan.qrCodeLimit,
        qrCodeTypes: plan.qrCodeTypes,
        isPopular: plan.isPopular,
        isDefault: plan.isDefault,
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
    const tierName = (countryInfo?.tier?.name || 'High Income').toLowerCase();
    const currency = countryInfo?.currencyCode || 'USD';
    const symbol = countryInfo?.currencySymbol || '$';

    const exchangeRate = await this.getExchangeRate(currency);

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    // Tier selection with smart fallback
    const tryTier = (tier: 'low' | 'middle' | 'high') => {
      if (tier === 'low' && plan.lowIncomeMonthlyUSD) {
        return { m: plan.lowIncomeMonthlyUSD, q: plan.lowIncomeQuarterlyUSD, y: plan.lowIncomeYearlyUSD };
      }
      if (tier === 'middle' && plan.middleIncomeMonthlyUSD) {
        return { m: plan.middleIncomeMonthlyUSD, q: plan.middleIncomeQuarterlyUSD, y: plan.middleIncomeYearlyUSD };
      }
      return { m: plan.highIncomeMonthlyUSD, q: plan.highIncomeQuarterlyUSD, y: plan.highIncomeYearlyUSD };
    };

    let selected;
    if (tierName.includes('low')) selected = tryTier('low');
    else if (tierName.includes('middle')) selected = tryTier('middle');
    else selected = tryTier('high');

    const pricing = {
      monthly: this.formatPrice((selected.m || 0) * exchangeRate, currency),
      quarterly: this.formatPrice((selected.q || 0) * exchangeRate, currency),
      yearly: this.formatPrice((selected.y || 0) * exchangeRate, currency),
    };

    return {
      ...plan,
      currency,
      currencySymbol: symbol,
      pricing,
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
