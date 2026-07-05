import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { PrismaService } from '../prisma/prisma.service';
import { FormFieldType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('FormsService', () => {
  let service: FormsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    qRCode: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    form: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    formField: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    formSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateValue', () => {
    it('should validate number correctly', () => {
      const field = { type: FormFieldType.number, label: 'Age' };
      expect(() => (service as any).validateValue(field, '25')).not.toThrow();
      expect(() => (service as any).validateValue(field, 'abc')).toThrow(
        BadRequestException,
      );
    });

    it('should validate range correctly', () => {
      const field = {
        type: FormFieldType.range,
        label: 'Score',
        validation: { min: 0, max: 10 },
      };
      expect(() => (service as any).validateValue(field, '5')).not.toThrow();
      expect(() => (service as any).validateValue(field, '-1')).toThrow(
        BadRequestException,
      );
      expect(() => (service as any).validateValue(field, '11')).toThrow(
        BadRequestException,
      );
    });

    it('should validate email correctly', () => {
      const field = { type: FormFieldType.email, label: 'Email' };
      expect(() =>
        (service as any).validateValue(field, 'test@example.com'),
      ).not.toThrow();
      expect(() =>
        (service as any).validateValue(field, 'invalid-email'),
      ).toThrow(BadRequestException);
    });

    it('should validate select options correctly', () => {
      const field = {
        type: FormFieldType.select,
        label: 'Color',
        options: [
          { label: 'Red', value: 'red' },
          { label: 'Blue', value: 'blue' },
        ],
      };
      expect(() => (service as any).validateValue(field, 'red')).not.toThrow();
      expect(() => (service as any).validateValue(field, 'green')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('submitForm', () => {
    it('should throw if required field is missing', async () => {
      mockPrismaService.qRCode.findUnique.mockResolvedValue({
        type: 'form',
        form: {
          id: 'form-1',
          fields: [
            {
              id: 'f1',
              label: 'Name',
              required: true,
              type: FormFieldType.text,
            },
          ],
        },
      });

      await expect(
        service.submitForm('short', { answers: {} }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create submission if validation passes', async () => {
      mockPrismaService.qRCode.findUnique.mockResolvedValue({
        type: 'form',
        form: {
          id: 'form-1',
          fields: [
            {
              id: 'f1',
              label: 'Name',
              required: true,
              type: FormFieldType.text,
            },
          ],
        },
      });
      mockPrismaService.formSubmission.create.mockResolvedValue({
        id: 'sub-1',
      });

      const res = await service.submitForm('short', {
        answers: { f1: 'John' },
      });
      expect(res).toBeDefined();
      expect(mockPrismaService.formSubmission.create).toHaveBeenCalled();
    });
  });

  describe('getLeadsForIntegration', () => {
    it('should call findMany with correct filters for specialized types', async () => {
      const userId = 'user-1';
      const query = { page: 1, limit: 10, types: ['booking', 'menu'] };

      (mockPrismaService.formSubmission.count as jest.Mock).mockResolvedValue(1);
      (mockPrismaService.formSubmission.findMany as jest.Mock).mockResolvedValue([
        { id: 'sub-1', form: { qrCode: { type: 'booking' } } },
      ]);

      const result = await service.getLeadsForIntegration(userId, query);

      expect(mockPrismaService.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            form: expect.objectContaining({
              qrCode: expect.objectContaining({
                userId: 'user-1',
                type: { in: ['booking', 'menu'] },
              }),
            }),
          }),
          skip: 0,
          take: 10,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should apply search filter correctly', async () => {
      const userId = 'user-1';
      const query = { page: 1, limit: 10, search: 'test' };

      await service.getLeadsForIntegration(userId, query);

      expect(mockPrismaService.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { form: { title: { contains: 'test', mode: 'insensitive' } } },
              { form: { qrCode: { name: { contains: 'test', mode: 'insensitive' } } } },
            ],
          }),
        }),
      );
    });

    it('should filter by specific qrCodeId (non-UUID sets shortId)', async () => {
      const userId = 'user-1';
      const query = { qrCodeId: 'qr-123' };

      await service.getLeadsForIntegration(userId, query);

      expect(mockPrismaService.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            form: expect.objectContaining({
              qrCode: expect.objectContaining({
                shortId: 'qr-123',
              }),
            }),
          }),
        }),
      );
    });

    it('should filter by specific qrCodeId (UUID uses OR)', async () => {
      const userId = 'user-1';
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const query = { qrCodeId: uuid };

      (mockPrismaService.formSubmission.count as jest.Mock).mockResolvedValue(1);
      (mockPrismaService.formSubmission.findMany as jest.Mock).mockResolvedValue([
        { id: 'sub-1', form: { qrCode: { type: 'booking' } } },
      ]);

      await service.getLeadsForIntegration(userId, query);

      expect(mockPrismaService.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            form: expect.objectContaining({
              qrCode: expect.objectContaining({
                OR: [{ id: uuid }, { shortId: uuid }],
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('getAllSubmissions pagination', () => {
    it('should return paginated results with meta', async () => {
      const userId = 'user-1';
      const submissions = [{ id: 'sub-1' }, { id: 'sub-2' }];
      mockPrismaService.formSubmission.count.mockResolvedValue(10);
      mockPrismaService.formSubmission.findMany.mockResolvedValue(submissions);

      const result = await service.getAllSubmissions(userId, 2, 5);

      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(10);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
      expect(result.meta.totalPages).toBe(2);
    });

    it('should use provided limit as take value', async () => {
      const userId = 'user-1';
      mockPrismaService.formSubmission.count.mockResolvedValue(0);
      mockPrismaService.formSubmission.findMany.mockResolvedValue([]);

      await service.getAllSubmissions(userId, 3, 25);

      expect(mockPrismaService.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
          take: 25,
        }),
      );
    });
  });
});
