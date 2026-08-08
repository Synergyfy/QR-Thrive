import { Test, TestingModule } from '@nestjs/testing';
import { QRCodesService } from './qr-codes.service';
import { PrismaService } from '../prisma/prisma.service';
import { FormsService } from '../forms/forms.service';
import { UploadService } from '../upload/upload.service';
import { PushService } from '../notifications/push.service';
import { VemtapAuthService } from '../integration/vemtap-auth.service';
import * as geoip from 'geoip-lite';

jest.mock('geoip-lite');

describe('QRCodesService Analytics', () => {
  let service: QRCodesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    qRCode: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    scan: {
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockFormsService = { createOrUpdateForm: jest.fn() };
  const mockUploadService = { deleteFile: jest.fn() };
  const mockPushService = { sendPushNotification: jest.fn().mockResolvedValue({}) };
  const mockVemtapAuthService = { verifyAssertion: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRCodesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FormsService, useValue: mockFormsService },
        { provide: UploadService, useValue: mockUploadService },
        { provide: PushService, useValue: mockPushService },
        { provide: VemtapAuthService, useValue: mockVemtapAuthService },
      ],
    }).compile();

    service = module.get<QRCodesService>(QRCodesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should record a scan with location data', async () => {
    const shortId = 'test-id';
    const ip = '207.97.227.239'; // GitHub IP (USA)
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

    const mockQR = {
      id: 'qr-1',
      shortId,
      clicks: 0,
      user: { id: 'user-1', createdAt: new Date(), plan: { isDefault: false } },
    };
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

  describe('getStats with database-level aggregation', () => {
    it('should return empty stats when user has no QR codes', async () => {
      mockPrismaService.qRCode.findMany.mockResolvedValue([]);

      const result = await service.getStats('user-empty');

      expect(result.totalQrCodes).toBe(0);
      expect(result.totalScans).toBe(0);
    });

    it('should return aggregated stats from $queryRaw queries', async () => {
      mockPrismaService.qRCode.findMany.mockResolvedValue([
        { id: 'qr-1', name: 'Test QR' },
      ]);

      const bigInt = (n: number) => BigInt(n);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ count: bigInt(10) }])
        .mockResolvedValueOnce([
          { date: '2026-01-01', count: bigInt(5) },
          { date: '2026-01-02', count: bigInt(5) },
        ])
        .mockResolvedValueOnce([
          { country: 'US', count: bigInt(8) },
          { country: 'NG', count: bigInt(2) },
        ])
        .mockResolvedValueOnce([
          { city: 'NYC', count: bigInt(5) },
          { city: 'Lagos', count: bigInt(3) },
        ])
        .mockResolvedValueOnce([{ qrCodeId: 'qr-1', count: bigInt(10) }])
        .mockResolvedValueOnce([{ count: bigInt(5) }]);

      const result = await service.getStats('user-1');

      expect(result.totalQrCodes).toBe(1);
      expect(result.totalScans).toBe(10);
      expect(result.uniqueVisitors).toBe(5);
      expect(result.scansByDate).toHaveLength(2);
      expect(result.scansByCountry).toHaveLength(2);
      expect(result.scansByCity).toHaveLength(2);
      expect(result.topQrCodes).toHaveLength(1);
      expect(result.topQrCodes[0].name).toBe('Test QR');
      expect(result.topQrCodes[0].scans).toBe(10);
    });

    it('should apply date filters when provided', async () => {
      mockPrismaService.qRCode.findMany.mockResolvedValue([
        { id: 'qr-1', name: 'Test QR' },
      ]);

      const bigInt = (n: number) => BigInt(n);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ count: bigInt(3) }])
        .mockResolvedValueOnce([
          { date: '2026-01-15', count: bigInt(3) },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ qrCodeId: 'qr-1', count: bigInt(3) }])
        .mockResolvedValueOnce([{ count: bigInt(2) }]);

      const result = await service.getStats('user-1', '2026-01-01', '2026-01-31');

      expect(result.totalScans).toBe(3);
      expect(result.uniqueVisitors).toBe(2);
    });
  });
});
