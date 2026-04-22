import { Test, TestingModule } from '@nestjs/testing';
import { PushService } from './push.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

jest.mock('web-push');

describe('PushService', () => {
  let service: PushService;
  let prisma: PrismaService;
  let config: ConfigService;

  const mockPrismaService = {
    pushSubscription: {
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        VAPID_PUBLIC_KEY: 'test-public-key',
        VAPID_PRIVATE_KEY: 'test-private-key',
        VAPID_SUBJECT: 'mailto:test@example.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PushService>(PushService);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should set VAPID details if keys are present', () => {
      service.onModuleInit();
      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:test@example.com',
        'test-public-key',
        'test-private-key',
      );
    });

    it('should handle VAPID configuration errors gracefully', () => {
      (webpush.setVapidDetails as jest.Mock).mockImplementation(() => {
        throw new Error('Vapid error');
      });
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });

  describe('saveSubscription', () => {
    it('should upsert a subscription', async () => {
      const dto = {
        endpoint: 'https://test.com/push',
        keys: { p256dh: 'dh', auth: 'auth' },
      };
      await service.saveSubscription('user-1', dto);
      expect(mockPrismaService.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: dto.endpoint },
        update: { userId: 'user-1', p256dh: 'dh', auth: 'auth' },
        create: { userId: 'user-1', endpoint: dto.endpoint, p256dh: 'dh', auth: 'auth' },
      });
    });
  });

  describe('sendPushNotification', () => {
    it('should send notifications to all user subscriptions', async () => {
      const subs = [
        { endpoint: 'ep1', p256dh: 'd1', auth: 'a1' },
        { endpoint: 'ep2', p256dh: 'd2', auth: 'a2' },
      ];
      mockPrismaService.pushSubscription.findMany.mockResolvedValue(subs);
      (webpush.sendNotification as jest.Mock).mockResolvedValue({});

      await service.sendPushNotification('user-1', { title: 'Hi' });

      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should remove expired subscriptions (410 Gone)', async () => {
      const sub = { endpoint: 'ep-expired', p256dh: 'd1', auth: 'a1' };
      mockPrismaService.pushSubscription.findMany.mockResolvedValue([sub]);
      
      const error: any = new Error('Expired');
      error.statusCode = 410;
      (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

      await service.sendPushNotification('user-1', { title: 'Hi' });

      expect(mockPrismaService.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint: 'ep-expired' },
      });
    });
  });
});
