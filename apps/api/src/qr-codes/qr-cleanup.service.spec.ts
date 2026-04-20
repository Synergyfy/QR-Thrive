import { Test, TestingModule } from '@nestjs/testing';
import { QRCodesService } from './qr-codes.service';
import { PrismaService } from '../prisma/prisma.service';
import { FormsService } from '../forms/forms.service';
import { UploadService } from '../upload/upload.service';

describe('QRCodesService Cleanup Logic', () => {
  let service: QRCodesService;
  let uploadService: UploadService;

  const mockPrismaService = {
    qRCode: {
      findFirst: jest.fn(),
      delete: jest.fn().mockResolvedValue({ id: 'some-id' }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-id',
        plan: 'PRO',
        createdAt: new Date(),
      }),
    },
  };

  const mockFormsService = {
    createOrUpdateForm: jest.fn(),
  };

  const mockUploadService = {
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
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
    uploadService = module.get<UploadService>(UploadService);
  });

  describe('extractCloudinaryUrls', () => {
    it('should extract URLs containing cloudinary.com and qr-thrive/', () => {
      const data = {
        logo: 'https://res.cloudinary.com/demo/image/upload/qr-thrive/logo/test.png',
        banner:
          'https://res.cloudinary.com/demo/image/upload/qr-thrive/banners/bg.jpg',
        nested: {
          url: 'https://res.cloudinary.com/demo/image/upload/qr-thrive/other/file.pdf',
          other: 'https://google.com',
        },
        array: [
          'https://res.cloudinary.com/demo/image/upload/qr-thrive/gallery/1.png',
          'not-a-url',
        ],
      };

      const urls = (service as any).extractCloudinaryUrls(data);
      expect(urls).toHaveLength(4);
      expect(urls).toContain(
        'https://res.cloudinary.com/demo/image/upload/qr-thrive/logo/test.png',
      );
      expect(urls).toContain(
        'https://res.cloudinary.com/demo/image/upload/qr-thrive/banners/bg.jpg',
      );
      expect(urls).toContain(
        'https://res.cloudinary.com/demo/image/upload/qr-thrive/other/file.pdf',
      );
      expect(urls).toContain(
        'https://res.cloudinary.com/demo/image/upload/qr-thrive/gallery/1.png',
      );
    });
  });

  describe('extractPublicIdFromUrl', () => {
    it('should extract publicId correctly', () => {
      const url =
        'https://res.cloudinary.com/demo/image/upload/v12345/qr-thrive/logo/test-123.png';
      const publicId = (service as any).extractPublicIdFromUrl(url);
      expect(publicId).toBe('qr-thrive/logo/test-123');
    });

    it('should return null for non-cloudinary URLs', () => {
      const url = 'https://google.com/image.png';
      const publicId = (service as any).extractPublicIdFromUrl(url);
      expect(publicId).toBeNull();
    });

    it('should return null if qr-thrive/ is missing', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/other/test.png';
      const publicId = (service as any).extractPublicIdFromUrl(url);
      expect(publicId).toBeNull();
    });
  });

  describe('remove', () => {
    it('should find and delete all associated Cloudinary files', async () => {
      const qrCode = {
        id: 'qr-id',
        userId: 'user-id',
        logo: 'https://res.cloudinary.com/demo/image/upload/qr-thrive/logo/main.png',
        data: {
          menu: {
            banner:
              'https://res.cloudinary.com/demo/image/upload/qr-thrive/menu/banner.jpg',
            categories: [
              {
                items: [
                  {
                    image:
                      'https://res.cloudinary.com/demo/image/upload/qr-thrive/items/pizza.png',
                  },
                ],
              },
            ],
          },
        },
      };

      mockPrismaService.qRCode.findFirst.mockResolvedValue(qrCode);

      await service.remove('qr-id', 'user-id');

      expect(uploadService.deleteFile).toHaveBeenCalledTimes(3);
      expect(uploadService.deleteFile).toHaveBeenCalledWith(
        'qr-thrive/logo/main',
      );
      expect(uploadService.deleteFile).toHaveBeenCalledWith(
        'qr-thrive/menu/banner',
      );
      expect(uploadService.deleteFile).toHaveBeenCalledWith(
        'qr-thrive/items/pizza',
      );
      expect(mockPrismaService.qRCode.delete).toHaveBeenCalledWith({
        where: { id: 'qr-id' },
      });
    });

    it('should handle duplicate URLs and only call delete once per publicId', async () => {
      const qrCode = {
        id: 'qr-id',
        userId: 'user-id',
        logo: 'https://res.cloudinary.com/demo/image/upload/qr-thrive/logo/main.png',
        data: {
          duplicate:
            'https://res.cloudinary.com/demo/image/upload/qr-thrive/logo/main.png',
        },
      };

      mockPrismaService.qRCode.findFirst.mockResolvedValue(qrCode);

      await service.remove('qr-id', 'user-id');

      expect(uploadService.deleteFile).toHaveBeenCalledTimes(1);
      expect(uploadService.deleteFile).toHaveBeenCalledWith(
        'qr-thrive/logo/main',
      );
    });
  });
});
