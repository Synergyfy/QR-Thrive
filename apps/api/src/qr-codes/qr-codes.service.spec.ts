import { Test, TestingModule } from '@nestjs/testing';
import { QRCodesService } from './qr-codes.service';
import { PrismaService } from '../prisma/prisma.service';
import { QRType, PlanType } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { FormsService } from '../forms/forms.service';
import { UploadService } from '../upload/upload.service';

describe('QRCodesService', () => {
  let service: QRCodesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const now = new Date();
        if (where.id === 'user-free-new') {
          return Promise.resolve({ id: 'user-free-new', plan: PlanType.FREE, createdAt: now });
        }
        if (where.id === 'user-free-old') {
          const oldDate = new Date();
          oldDate.setDate(oldDate.getDate() - 10);
          return Promise.resolve({ id: 'user-free-old', plan: PlanType.FREE, createdAt: oldDate });
        }
        if (where.id === 'user-pro') {
          const oldDate = new Date();
          oldDate.setDate(oldDate.getDate() - 10);
          return Promise.resolve({ id: 'user-pro', plan: PlanType.PRO, createdAt: oldDate });
        }
        return Promise.resolve(null);
      }),
    },
    qRCode: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'some-id', ...args.data })),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: 'existing-id', userId: 'user-pro' }),
      findUnique: jest.fn().mockImplementation(({ where, include }) => {
        const now = new Date();
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 10);

        if (where.shortId === 'short-free-new') {
          return Promise.resolve({ id: 'id1', shortId: 'short-free-new', user: { plan: PlanType.FREE, createdAt: now } });
        }
        if (where.shortId === 'short-free-old') {
          return Promise.resolve({ id: 'id2', shortId: 'short-free-old', user: { plan: PlanType.FREE, createdAt: oldDate } });
        }
        return Promise.resolve({ id: 'existing-id', shortId: 'short', user: { plan: PlanType.PRO, createdAt: oldDate } });
      }),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ ...args.data })),
      delete: jest.fn().mockResolvedValue({ id: 'existing-id' }),
    },
    scan: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
  };

  const mockFormsService = {
    createOrUpdateForm: jest.fn(),
  };

  const mockUploadService = {
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRCodesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FormsService,
          useValue: mockFormsService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<QRCodesService>(QRCodesService);
    prisma = module.get<PrismaService>(PrismaService);
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
    expect((res as any).type).toEqual(QRType.pdf);
  });

  it('should allow scanning a QR within trial', async () => {
    const res = await service.recordScan('short-free-new', '127.0.0.1', 'ua');
    expect(res).toBeDefined();
  });

  it('should block scanning a QR after trial expires', async () => {
    await expect(service.recordScan('short-free-old', '127.0.0.1', 'ua')).rejects.toThrow(ForbiddenException);
  });
});
