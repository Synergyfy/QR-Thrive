import { Test, TestingModule } from '@nestjs/testing';
import { QRCodesService } from './qr-codes.service';
import { PrismaService } from '../prisma/prisma.service';
import { QRType } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { FormsService } from '../forms/forms.service';
import { UploadService } from '../upload/upload.service';
import { PushService } from '../notifications/push.service';

describe('QRCodesService', () => {
  let service: QRCodesService;
  let prisma: PrismaService;
  let pushService: PushService;

  const now = new Date();
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 10);

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'user-free-new') {
          return Promise.resolve({ id: 'user-free-new', createdAt: now, plan: { isDefault: true } });
        }
        if (where.id === 'user-free-old') {
          return Promise.resolve({ id: 'user-free-old', createdAt: oldDate, plan: null });
        }
        if (where.id === 'user-pro') {
          return Promise.resolve({ id: 'user-pro', createdAt: oldDate, plan: { isDefault: false } });
        }
        return Promise.resolve(null);
      }),
    },
    qRCode: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'some-id', ...args.data })),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: 'existing-id', userId: 'user-pro' }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const qrMap = {
          'short-free-new': {
            id: 'id1',
            shortId: 'short-free-new',
            user: { createdAt: now, plan: { isDefault: true } },
          },
          'short-free-old': {
            id: 'id2',
            shortId: 'short-free-old',
            user: { createdAt: oldDate, plan: null },
          },
          'short-opt-out': {
            id: 'id-opt-out',
            shortId: 'short-opt-out',
            userId: 'user-id-1',
            name: 'Opt-out QR',
            user: { createdAt: now, plan: { isDefault: false }, scanNotificationsEnabled: false },
          },
          'short': {
            id: 'existing-id',
            shortId: 'short',
            userId: 'user-id-1',
            name: 'Test QR',
            user: { createdAt: now, plan: { isDefault: false }, scanNotificationsEnabled: true },
          },
        };
        return Promise.resolve(qrMap[where.shortId] || qrMap['short']);
      }),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ ...args.data })),
      delete: jest.fn().mockResolvedValue({ id: 'existing-id' }),
    },
    scan: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
  };

  const mockFormsService = { createOrUpdateForm: jest.fn() };
  const mockUploadService = { deleteFile: jest.fn() };
  const mockPushService = { sendPushNotification: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRCodesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FormsService, useValue: mockFormsService },
        { provide: UploadService, useValue: mockUploadService },
        { provide: PushService, useValue: mockPushService },
      ],
    }).compile();

    service = module.get<QRCodesService>(QRCodesService);
    prisma = module.get<PrismaService>(PrismaService);
    pushService = module.get<PushService>(PushService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should allow FREE user within trial to create QR', async () => {
    const dto = { name: 'Trial QR', type: QRType.pdf, data: {}, design: {}, frame: {} };
    const res = await service.create('user-free-new', dto);
    expect(res).toBeDefined();
    expect((res as any).type).toEqual(QRType.pdf);
  });

  it('should throw ForbiddenException when FREE user trial expires', async () => {
    const dto = { name: 'Expired QR', type: QRType.url, data: {}, design: {}, frame: {} };
    await expect(service.create('user-free-old', dto)).rejects.toThrow(ForbiddenException);
  });

  it('should allow PRO user to create QR even after 7 days', async () => {
    const dto = { name: 'Pro QR', type: QRType.pdf, data: {}, design: {}, frame: {} };
    const res = await service.create('user-pro', dto);
    expect(res).toBeDefined();
  });

  it('should allow scanning a QR within trial', async () => {
    const res = await service.recordScan('short-free-new', '127.0.0.1', 'ua');
    expect(res).toBeDefined();
  });

  it('should block scanning a QR after trial expires', async () => {
    await expect(service.recordScan('short-free-old', '127.0.0.1', 'ua')).rejects.toThrow(ForbiddenException);
  });

  describe('recordScan Notifications', () => {
    it('should trigger push notification if user has enabled it', async () => {
      await service.recordScan('short', '127.0.0.1', 'ua');
      expect(mockPushService.sendPushNotification).toHaveBeenCalled();
    });

    it('should NOT trigger push notification if user has disabled it', async () => {
      await service.recordScan('short-opt-out', '127.0.0.1', 'ua');
      expect(mockPushService.sendPushNotification).not.toHaveBeenCalled();
    });

    it('should not crash if push service fails', async () => {
      mockPushService.sendPushNotification.mockRejectedValueOnce(new Error('Push failed'));
      const res = await service.recordScan('short', '127.0.0.1', 'ua');
      expect(res).toBeDefined();
    });
  });
});
