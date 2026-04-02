import { Test, TestingModule } from '@nestjs/testing';
import { QRCodesService } from './qr-codes.service';
import { PrismaService } from '../prisma/prisma.service';
import { QRType } from '@prisma/client';

describe('QRCodesService', () => {
  let service: QRCodesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    qRCode: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'some-id', ...args.data })),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: 'existing-id', userId: 'user-1' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'existing-id', shortId: 'short' }),
      update: jest.fn().mockImplementation((args) => Promise.resolve({ ...args.data })),
      delete: jest.fn().mockResolvedValue({ id: 'existing-id' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRCodesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<QRCodesService>(QRCodesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new qr code', async () => {
    const dto = { name: 'Test QR', type: QRType.url, data: {}, design: {}, frame: {} };
    const res = await service.create('user-1', dto);
    expect(res).toBeDefined();
    expect((res as any).userId).toEqual('user-1');
    expect((res as any).type).toEqual(QRType.url);
  });

  it('should list all for user', async () => {
    const res = await service.findAll('user-1');
    expect(res).toEqual([]);
  });
});
