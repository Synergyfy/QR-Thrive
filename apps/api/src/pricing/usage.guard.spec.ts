import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsageGuard } from './usage.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CapabilityService } from '../integration/capability.service';
import type { VemTapSubscriptionPayload } from '../integration/vemtap-subscription.guard';

describe('UsageGuard', () => {
  let guard: UsageGuard;
  let prisma: PrismaService;
  let capabilityService: CapabilityService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    qRCode: {
      count: jest.fn(),
    },
  };

  const mockCapabilityService = {
    getCapabilities: jest.fn(),
  };

  const createMockRequest = (overrides: any = {}) => ({
    user: overrides.user || null,
    body: overrides.body || {},
    vemtapSubscription: overrides.vemtapSubscription || undefined,
  });

  const createExecutionContext = (request: any) => ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageGuard,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CapabilityService, useValue: mockCapabilityService },
      ],
    }).compile();

    guard = module.get<UsageGuard>(UsageGuard);
    prisma = module.get<PrismaService>(PrismaService);
    capabilityService = module.get<CapabilityService>(CapabilityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate - VemTap Subscription Path', () => {
    it('should allow access when VemTap subscription is active', async () => {
      const vemtapSubscription: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'active',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url', 'text', 'vcard'],
          canScan: true,
          canAnalytics: true,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockPrisma.qRCode.count.mockResolvedValue(50);

      const request = createMockRequest({
        vemtapSubscription,
        body: { type: 'url' },
      });
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when VemTap subscription is trial', async () => {
      const vemtapSubscription: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'trial',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url', 'text'],
          canScan: true,
          canAnalytics: false,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockPrisma.qRCode.count.mockResolvedValue(10);

      const request = createMockRequest({
        vemtapSubscription,
        body: { type: 'text' },
      });
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when QR type not allowed', async () => {
      const vemtapSubscription: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'active',
        qrThrivePlanId: 'plan-basic',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url', 'text'], // No wifi
          canScan: true,
          canAnalytics: false,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      const request = createMockRequest({
        vemtapSubscription,
        body: { type: 'wifi' },
      });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when QR limit reached', async () => {
      const vemtapSubscription: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'active',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url', 'text'],
          canScan: true,
          canAnalytics: true,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockPrisma.qRCode.count.mockResolvedValue(100); // At limit

      const request = createMockRequest({
        vemtapSubscription,
        body: { type: 'url' },
      });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when QR limit exceeded', async () => {
      const vemtapSubscription: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'active',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url', 'text'],
          canScan: true,
          canAnalytics: true,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockPrisma.qRCode.count.mockResolvedValue(150); // Over limit

      const request = createMockRequest({
        vemtapSubscription,
        body: { type: 'url' },
      });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should use default limit when planCapabilities missing qrCodeLimit', async () => {
      const vemtapSubscription: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'active',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: undefined as any,
          allowedQRTypes: ['url', 'text'],
          canScan: true,
          canAnalytics: true,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockPrisma.qRCode.count.mockResolvedValue(5); // Under default 10

      const request = createMockRequest({
        vemtapSubscription,
        body: { type: 'url' },
      });
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle no body in request', async () => {
      const vemtapSubscription: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'active',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url', 'text'],
          canScan: true,
          canAnalytics: true,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockPrisma.qRCode.count.mockResolvedValue(50);

      const request = {
        user: null,
        body: undefined,
        vemtapSubscription,
      };
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('canActivate - Native Auth Path', () => {
    it('should allow access when user has valid plan', async () => {
      const mockUser = {
        id: 'user-123',
        plan: {
          id: 'plan-1',
          name: 'Pro Plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url', 'text', 'vcard'],
          isDefault: false,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.qRCode.count.mockResolvedValue(50);

      const request = createMockRequest({
        user: { userId: 'user-123' },
        body: { type: 'url' },
      });
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        user: { userId: 'non-existent' },
        body: { type: 'url' },
      });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user has no plan', async () => {
      const mockUser = {
        id: 'user-123',
        plan: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const request = createMockRequest({
        user: { userId: 'user-123' },
        body: { type: 'url' },
      });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when QR type not in plan', async () => {
      const mockUser = {
        id: 'user-123',
        plan: {
          id: 'plan-1',
          name: 'Basic Plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url', 'text'],
          isDefault: false,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.qRCode.count.mockResolvedValue(50);

      const request = createMockRequest({
        user: { userId: 'user-123' },
        body: { type: 'wifi' },
      });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when QR limit reached', async () => {
      const mockUser = {
        id: 'user-123',
        plan: {
          id: 'plan-1',
          name: 'Pro Plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url', 'text'],
          isDefault: false,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.qRCode.count.mockResolvedValue(100);

      const request = createMockRequest({
        user: { userId: 'user-123' },
        body: { type: 'url' },
      });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined user in native auth', async () => {
      const request = createMockRequest({
        user: undefined,
        body: {},
      });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should handle null user in native auth', async () => {
      const request = createMockRequest({
        user: null,
        body: {},
      });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should handle no body in native auth', async () => {
      const mockUser = {
        id: 'user-123',
        plan: {
          id: 'plan-1',
          name: 'Pro Plan',
          qrCodeLimit: 100,
          qrCodeTypes: ['url', 'text'],
          isDefault: false,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.qRCode.count.mockResolvedValue(50);

      const request = {
        user: { userId: 'user-123' },
        body: undefined,
      };
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});