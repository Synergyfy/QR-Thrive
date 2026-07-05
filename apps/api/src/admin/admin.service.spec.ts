import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from '../payments/paystack.service';
import { PricingService } from '../pricing/pricing.service';
import { VemtapService } from '../integration/vemtap.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrismaService = {
    country: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    plan: {
      findFirst: jest.fn(),
    },
  };
  const mockPaystackService = {};
  const mockPricingService = {
    getCachedSystemConfig: jest.fn(),
    getCountryInfo: jest.fn(),
  };
  const mockVemtapService = {
    fetchPlans: jest.fn(),
  };
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PaystackService, useValue: mockPaystackService },
        { provide: PricingService, useValue: mockPricingService },
        { provide: VemtapService, useValue: mockVemtapService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateCountry cache invalidation', () => {
    it('should invalidate pricing cache after updating country', async () => {
      mockPrismaService.country.findUnique.mockResolvedValue({
        code: 'NG',
        tier: 'LOW',
        currencyCode: 'NGN',
      });
      mockPrismaService.country.update.mockResolvedValue({
        code: 'NG',
        tier: 'LOW',
        currencyCode: 'NGN',
        taxRate: 7.5,
      });

      await service.updateCountry('NG', { taxRate: 7.5 });

      expect(mockCacheManager.del).toHaveBeenCalledWith('pricing:country:NG');
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'pricing:plans:tier:LOW:currency:NGN',
      );
    });

    it('should throw NotFoundException for non-existent country', async () => {
      mockPrismaService.country.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCountry('XX', { taxRate: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('handlePlanExpirations with updateMany', () => {
    it('should use updateMany to downgrade expired users', async () => {
      const expiredUsers = [
        { id: 'user-1', trialEndsAt: new Date('2025-01-01'), subscriptionStatus: 'active' },
        { id: 'user-2', trialEndsAt: new Date('2025-01-01'), subscriptionStatus: 'trialing' },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(expiredUsers);
      mockPrismaService.plan.findFirst.mockResolvedValue({ id: 'free-plan-id' });
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 2 });

      await service.handlePlanExpirations();

      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
        data: {
          planId: 'free-plan-id',
          subscriptionStatus: 'expired',
          billingCycle: null,
          trialEndsAt: null,
        },
      });
    });

    it('should do nothing if no expired users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.handlePlanExpirations();

      expect(mockPrismaService.user.updateMany).not.toHaveBeenCalled();
    });
  });
});
