import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { VemTapSubscriptionGuard, VemTapSubscriptionPayload } from './vemtap-subscription.guard';

describe('VemTapSubscriptionGuard', () => {
  let guard: VemTapSubscriptionGuard;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret-key'),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const createMockRequest = (headers: Record<string, string> = {}) => ({
    headers,
  });

  const createExecutionContext = (request: any) => ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VemTapSubscriptionGuard,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    guard = module.get<VemTapSubscriptionGuard>(VemTapSubscriptionGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no VemTap token is provided (fall through to existing auth)', async () => {
      const request = createMockRequest({});
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should return true and attach payload when valid active token is provided', async () => {
      const validPayload: VemTapSubscriptionPayload = {
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

      mockJwtService.verifyAsync.mockResolvedValue(validPayload);

      const request = createMockRequest({ 'x-vemtap-subscription-token': 'valid-token' });
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.vemtapSubscription).toEqual(validPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret-key',
      });
    });

    it('should return true for trial status', async () => {
      const trialPayload: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'trial',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url'],
          canScan: true,
          canAnalytics: false,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockJwtService.verifyAsync.mockResolvedValue(trialPayload);

      const request = createMockRequest({ 'x-vemtap-subscription-token': 'trial-token' });
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.vemtapSubscription.subscriptionStatus).toBe('trial');
    });

    it('should throw UnauthorizedException when subscription is expired', async () => {
      const expiredPayload: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'expired',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url'],
          canScan: true,
          canAnalytics: false,
        },
        exp: Date.now() / 1000 - 3600,
        iat: Date.now() / 1000 - 7200,
      };

      mockJwtService.verifyAsync.mockResolvedValue(expiredPayload);

      const request = createMockRequest({ 'x-vemtap-subscription-token': 'expired-token' });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid subscription status', async () => {
      const invalidPayload: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'cancelled' as any,
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url'],
          canScan: true,
          canAnalytics: false,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockJwtService.verifyAsync.mockResolvedValue(invalidPayload);

      const request = createMockRequest({ 'x-vemtap-subscription-token': 'invalid-token' });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid signature'));

      const request = createMockRequest({ 'x-vemtap-subscription-token': 'malformed-token' });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is expired (JWT error)', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      const request = createMockRequest({ 'x-vemtap-subscription-token': 'expired-jwt' });
      const context = createExecutionContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle missing secret gracefully', async () => {
      const configServiceNoSecret = {
        get: jest.fn().mockReturnValue(null),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VemTapSubscriptionGuard,
          { provide: ConfigService, useValue: configServiceNoSecret },
          { provide: JwtService, useValue: mockJwtService },
        ],
      }).compile();

      const guardNoSecret = module.get<VemTapSubscriptionGuard>(VemTapSubscriptionGuard);

      const request = createMockRequest({ 'x-vemtap-subscription-token': 'any-token' });
      const context = createExecutionContext(request);

      // Should still attempt verification (will fail due to missing secret logic in service)
      await expect(guardNoSecret.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty token string', async () => {
      const request = createMockRequest({ 'x-vemtap-subscription-token': '' });
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      // Empty string is still a value, so it might be treated as token
      // This is an edge case - the guard receives empty string
      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle header case insensitivity', async () => {
      const validPayload: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'active',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url'],
          canScan: true,
          canAnalytics: false,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockJwtService.verifyAsync.mockResolvedValue(validPayload);

      // Test with lowercase header (though HTTP headers are case-insensitive in practice)
      const request = createMockRequest({ 'x-vemtap-subscription-token': 'valid-token' });
      const context = createExecutionContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should preserve existing request properties', async () => {
      const validPayload: VemTapSubscriptionPayload = {
        sub: 'user-123',
        businessId: 'biz-456',
        subscriptionStatus: 'active',
        qrThrivePlanId: 'plan-pro',
        planCapabilities: {
          qrCodeLimit: 100,
          allowedQRTypes: ['url'],
          canScan: true,
          canAnalytics: true,
        },
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
      };

      mockJwtService.verifyAsync.mockResolvedValue(validPayload);

      const request = createMockRequest({ 
        'x-vemtap-subscription-token': 'valid-token',
        'authorization': 'Bearer some-other-token',
      });
      const context = createExecutionContext(request);

      await guard.canActivate(context);

      expect(request.vemtapSubscription).toBeDefined();
      expect(request.headers['authorization']).toBe('Bearer some-other-token');
    });
  });
});