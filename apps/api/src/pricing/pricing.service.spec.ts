import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { PricingTier, QRType, BillingCycle, PriceStatus } from '@prisma/client';
import * as geoip from 'geoip-lite';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

jest.mock('geoip-lite');
jest.mock('axios');

describe('PricingService', () => {
  let service: PricingService;
  let prisma: PrismaService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    country: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    plan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    priceBook: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    systemConfig: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getCountryCodeByIp', () => {
    it('should return NG for local IP', () => {
      expect(service.getCountryCodeByIp('127.0.0.1')).toBe('NG');
    });

    it('should return detected country code from geoip', () => {
      (geoip.lookup as jest.Mock).mockReturnValue({ country: 'US' });
      expect(service.getCountryCodeByIp('8.8.8.8')).toBe('US');
    });
  });

  describe('getCountryInfo', () => {
    it('should return country info from DB', async () => {
      const mockCountry = { code: 'US', tier: PricingTier.HIGH, currencyCode: 'USD', taxRate: 0 };
      mockPrismaService.country.findUnique.mockResolvedValue(mockCountry);
      
      const result = await service.getCountryInfo('US');
      expect(result).toEqual(mockCountry);
    });

    it('should return fallback for NG if not in DB', async () => {
      mockPrismaService.country.findUnique.mockResolvedValue(null);
      const result = await service.getCountryInfo('NG');
      expect(result.tier).toBe(PricingTier.LOW);
      expect(result.currencyCode).toBe('NGN');
    });
  });

  describe('getLocalizedPlans', () => {
    it('should return plans with localized prices from PriceBook', async () => {
      // Setup
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.country.findUnique.mockResolvedValue({
        code: 'NG',
        currencyCode: 'NGN',
        currencySymbol: '₦',
        tier: PricingTier.LOW,
        taxRate: 7.5,
      });
      
      mockPrismaService.plan.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Pro',
          isActive: true,
          deletedAt: null,
          qrCodeLimit: 100,
          qrCodeTypes: [QRType.url],
          priceBooks: [
            {
              tier: PricingTier.LOW,
              currencyCode: 'NGN',
              billingCycle: BillingCycle.MONTHLY,
              price: 5000,
              status: PriceStatus.ACTIVE,
            },
            {
              tier: PricingTier.LOW,
              currencyCode: 'NGN',
              billingCycle: BillingCycle.QUARTERLY,
              price: 13500,
              status: PriceStatus.ACTIVE,
            },
            {
              tier: PricingTier.LOW,
              currencyCode: 'NGN',
              billingCycle: BillingCycle.YEARLY,
              price: 48000,
              status: PriceStatus.ACTIVE,
            }
          ]
        }
      ]);

      const result = await service.getLocalizedPlans('NG');

      expect(result[0].pricing.monthly!.amount).toBe(5000);
      expect(result[0].pricing.monthly!.currency).toBe('NGN');
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should fallback to USD if tier local price is missing', async () => {
      // Setup
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.country.findUnique.mockResolvedValue({
        code: 'NG',
        currencyCode: 'NGN',
        currencySymbol: '₦',
        tier: PricingTier.LOW,
      });
      
      mockPrismaService.plan.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Pro',
          isActive: true,
          deletedAt: null,
          priceBooks: [
            {
              tier: PricingTier.LOW,
              currencyCode: 'USD',
              billingCycle: BillingCycle.MONTHLY,
              price: 50,
              status: PriceStatus.ACTIVE,
            }
          ]
        }
      ]);

      const result = await service.getLocalizedPlans('NG');

      // Should use 50 (USD) since NGN is missing but it's converted if possible
      expect(result[0].pricing.monthly!.amount).toBeDefined();
    });
  });
});
