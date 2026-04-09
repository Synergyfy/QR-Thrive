import { Test, TestingModule } from '@nestjs/testing';
import { QRCodesService } from './qr-codes.service';
import { PrismaService } from '../prisma/prisma.service';
import * as geoip from 'geoip-lite';

jest.mock('geoip-lite');

describe('QRCodesService Analytics', () => {
  let service: QRCodesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    qRCode: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    scan: {
      create: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRCodesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<QRCodesService>(QRCodesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should record a scan with location data', async () => {
    const shortId = 'test-id';
    const ip = '207.97.227.239'; // GitHub IP (USA)
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

    const mockQR = { id: 'qr-1', shortId, clicks: 0 };
    mockPrismaService.qRCode.findUnique.mockResolvedValue(mockQR);

    (geoip.lookup as jest.Mock).mockReturnValue({
      city: 'San Francisco',
      country: 'US',
      region: 'CA',
    });

    await service.recordScan(shortId, ip, userAgent);

    expect(mockPrismaService.qRCode.update).toHaveBeenCalledWith({
      where: { id: 'qr-1' },
      data: { clicks: { increment: 1 } },
    });

    expect(mockPrismaService.scan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        qrCodeId: 'qr-1',
        ip,
        userAgent,
        browser: 'Chrome',
        os: 'Windows',
        city: 'San Francisco',
        country: 'US',
      }),
    });
  });
});
