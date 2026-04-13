import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { PricingTier, QRType } from '@prisma/client';
import * as geoip from 'geoip-lite';
import axios from 'axios';

jest.mock('geoip-lite');
jest.mock('axios');

describe('PricingService', () => {
  let service: PricingService;
  let prisma: PrismaService;

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
    systemConfig: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrismaService },
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
      const mockCountry = { code: 'US', tier: PricingTier.HIGH, currencyCode: 'USD' };
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
    it('should return plans with localized prices', async () => {
      // Setup
      (geoip.lookup as jest.Mock).mockReturnValue({ country: 'NG' });
      mockPrismaService.country.findUnique.mockResolvedValue({
        code: 'NG',
        currencyCode: 'NGN',
        currencySymbol: '₦',
        tier: PricingTier.LOW,
      });
      
      (axios.get as jest.Mock).mockResolvedValue({
        data: { rates: { NGN: 1500 } }
      });

      mockPrismaService.plan.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Pro',
          lowIncomeMonthlyUSD: 5,
          lowIncomeQuarterlyUSD: 13.5,
          lowIncomeYearlyUSD: 48,
          highIncomeMonthlyUSD: 20,
          isActive: true,
          deletedAt: null,
          qrCodeLimit: 100,
          qrCodeTypes: [QRType.url],
        }
      ]);

      const result = await service.getLocalizedPlans('1.2.3.4');

      expect(result[0].pricing.monthly).toBe(5 * 1500);
      expect(result[0].currency).toBe('NGN');
      expect(result[0].currencySymbol).toBe('₦');
    });

    it('should fallback to High Income if tier price is 0', async () => {
      // Setup
      (geoip.lookup as jest.Mock).mockReturnValue({ country: 'NG' });
      mockPrismaService.country.findUnique.mockResolvedValue({
        code: 'NG',
        currencyCode: 'NGN',
        currencySymbol: '₦',
        tier: PricingTier.LOW,
      });
      
      (axios.get as jest.Mock).mockResolvedValue({
        data: { rates: { NGN: 1500 } }
      });

      mockPrismaService.plan.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Pro',
          lowIncomeMonthlyUSD: 0, // Missing
          highIncomeMonthlyUSD: 20,
          highIncomeQuarterlyUSD: 54,
          highIncomeYearlyUSD: 192,
          isActive: true,
          deletedAt: null,
        }
      ]);

      const result = await service.getLocalizedPlans('1.2.3.4');

      // Should use 20 (High) instead of 0 (Low)
      expect(result[0].pricing.monthly).toBe(20 * 1500);
    });
  });
});
