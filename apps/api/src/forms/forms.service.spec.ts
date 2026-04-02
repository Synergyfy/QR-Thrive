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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateValue', () => {
    it('should validate number correctly', () => {
      const field = { type: FormFieldType.number, label: 'Age' };
      expect(() => (service as any).validateValue(field, '25')).not.toThrow();
      expect(() => (service as any).validateValue(field, 'abc')).toThrow(BadRequestException);
    });

    it('should validate range correctly', () => {
      const field = { 
        type: FormFieldType.range, 
        label: 'Score', 
        validation: { min: 0, max: 10 } 
      };
      expect(() => (service as any).validateValue(field, '5')).not.toThrow();
      expect(() => (service as any).validateValue(field, '-1')).toThrow(BadRequestException);
      expect(() => (service as any).validateValue(field, '11')).toThrow(BadRequestException);
    });

    it('should validate email correctly', () => {
      const field = { type: FormFieldType.email, label: 'Email' };
      expect(() => (service as any).validateValue(field, 'test@example.com')).not.toThrow();
      expect(() => (service as any).validateValue(field, 'invalid-email')).toThrow(BadRequestException);
    });

    it('should validate select options correctly', () => {
      const field = { 
        type: FormFieldType.select, 
        label: 'Color', 
        options: [{ label: 'Red', value: 'red' }, { label: 'Blue', value: 'blue' }] 
      };
      expect(() => (service as any).validateValue(field, 'red')).not.toThrow();
      expect(() => (service as any).validateValue(field, 'green')).toThrow(BadRequestException);
    });
  });

  describe('submitForm', () => {
    it('should throw if required field is missing', async () => {
      mockPrismaService.qRCode.findUnique.mockResolvedValue({
        form: {
          id: 'form-1',
          fields: [{ id: 'f1', label: 'Name', required: true, type: FormFieldType.text }]
        }
      });

      await expect(service.submitForm('short', { answers: {} }))
        .rejects.toThrow(BadRequestException);
    });

    it('should create submission if validation passes', async () => {
      mockPrismaService.qRCode.findUnique.mockResolvedValue({
        form: {
          id: 'form-1',
          fields: [{ id: 'f1', label: 'Name', required: true, type: FormFieldType.text }]
        }
      });
      mockPrismaService.formSubmission.create.mockResolvedValue({ id: 'sub-1' });

      const res = await service.submitForm('short', { answers: { f1: 'John' } });
      expect(res).toBeDefined();
      expect(mockPrismaService.formSubmission.create).toHaveBeenCalled();
    });
  });
});
