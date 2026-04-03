import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { FormFieldType } from '@prisma/client';

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFormByQRCode(qrCodeId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { 
        qrCodeId,
        qrCode: { userId }
      },
      include: { fields: { orderBy: { order: 'asc' } } },
    });

    if (!form) {
      throw new NotFoundException('Form not found for this QR Code');
    }

    return form;
  }

  async createOrUpdateForm(userId: string, createFormDto: CreateFormDto) {
    const { qrCodeId, title, description, fields } = createFormDto;

    // Verify ownership
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { id: qrCodeId },
    });

    if (!qrCode || qrCode.userId !== userId) {
      throw new ForbiddenException('You do not own this QR Code');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create or Update form
      const form = await tx.form.upsert({
        where: { qrCodeId },
        update: { title, description },
        create: { qrCodeId, title, description },
      });

      // Delete existing fields and recreate
      await tx.formField.deleteMany({ where: { formId: form.id } });

      if (fields && fields.length > 0) {
        const fieldData = fields.map((field, index) => ({
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          helpText: field.helpText,
          required: field.required ?? false,
          order: field.order ?? index,
          options: field.options as any,
          validation: field.validation as any,
          formId: form.id,
        }));

        await tx.formField.createMany({
          data: fieldData,
        });
      }

      return tx.form.findUnique({
        where: { id: form.id },
        include: { fields: { orderBy: { order: 'asc' } } },
      });
    }, {
      timeout: 10000, // 10 seconds timeout for larger form operations
    });
  }

  async getPublicForm(shortId: string) {
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { shortId },
      include: {
        form: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!qrCode || !qrCode.form) {
      throw new NotFoundException('Form not found');
    }

    return {
      id: qrCode.form.id,
      title: qrCode.form.title,
      description: qrCode.form.description,
      fields: qrCode.form.fields.map(f => ({
        id: f.id,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder,
        helpText: f.helpText,
        required: f.required,
        options: f.options,
        validation: f.validation,
      })),
    };
  }

  async submitForm(shortId: string, submitDto: SubmitFormDto, ip?: string, userAgent?: string) {
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { shortId },
      include: { form: { include: { fields: true } } },
    });

    if (!qrCode || !qrCode.form) {
      throw new NotFoundException('Form not found');
    }

    const form = qrCode.form;
    const { answers } = submitDto;
    const validatedAnswers: Record<string, any> = {};

    // Validate each field
    for (const field of form.fields) {
      const value = answers[field.id];

      // Required check
      if (field.required && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(`Field "${field.label}" is required`);
      }

      if (value !== undefined && value !== null && value !== '') {
        this.validateValue(field, value);
        validatedAnswers[field.id] = value;
      }
    }

    // Save submission
    return this.prisma.formSubmission.create({
      data: {
        formId: form.id,
        answers: validatedAnswers,
        ip,
        userAgent,
      },
    });
  }

  private validateValue(field: any, value: any) {
    const { type, validation, options, label } = field;

    switch (type) {
      case FormFieldType.number:
      case FormFieldType.range:
        const num = Number(value);
        if (isNaN(num)) {
          throw new BadRequestException(`${label} must be a number`);
        }
        if (validation) {
          const v = validation as any;
          if (v.min !== undefined && num < v.min) {
            throw new BadRequestException(`${label} must be at least ${v.min}`);
          }
          if (v.max !== undefined && num > v.max) {
            throw new BadRequestException(`${label} must be at most ${v.max}`);
          }
        }
        break;

      case FormFieldType.email:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          throw new BadRequestException(`${label} must be a valid email`);
        }
        break;

      case FormFieldType.phone:
        // Basic phone validation
        const phoneRegex = /^\+?[\d\s-]{7,15}$/;
        if (!phoneRegex.test(String(value))) {
          throw new BadRequestException(`${label} must be a valid phone number`);
        }
        break;

      case FormFieldType.select:
      case FormFieldType.radio:
        if (options && Array.isArray(options)) {
          const validValues = options.map((opt: any) => opt.value);
          if (!validValues.includes(value)) {
            throw new BadRequestException(`Invalid option for ${label}`);
          }
        }
        break;

      case FormFieldType.checkbox:
        // For single checkbox, value should be boolean or "true"/"false"
        // If it's a group, we might need different logic, but let's stick to simple checkbox for now
        break;
    }
  }

  async getSubmissions(qrCodeId: string, userId: string) {
    const form = await this.getFormByQRCode(qrCodeId, userId);
    
    return this.prisma.formSubmission.findMany({
      where: { formId: form.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
