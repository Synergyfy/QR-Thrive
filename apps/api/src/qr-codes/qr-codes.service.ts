import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQRCodeDto } from './dto/create-qr-code.dto';
import { UpdateQRCodeDto } from './dto/update-qr-code.dto';
import * as crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import * as geoip from 'geoip-lite';
import { User, Prisma, Plan } from '@prisma/client';

import { FormsService } from '../forms/forms.service';
import { UploadService } from '../upload/upload.service';
import { PushService } from '../notifications/push.service';

const TRIAL_DAYS = 7;

@Injectable()
export class QRCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly formsService: FormsService,
    private readonly uploadService: UploadService,
    private readonly pushService: PushService,
  ) {}

  /**
   * Checks if the user's access is active.
   * Logic:
   * 1. If they have a plan that isn't the 'Free' plan (non-default), they are active.
   * 2. If they have the default 'Free' plan, we might have a trial logic or just allow it within limits.
   * Note: UsageGuard handles the actual limits (counts and types).
   */
  private isAccessActive(user: User & { plan?: Plan | null }): boolean {
    if (user.plan && !user.plan.isDefault) return true;

    const now = new Date();
    const trialExpiry = new Date(user.createdAt);
    trialExpiry.setDate(trialExpiry.getDate() + TRIAL_DAYS);

    return now <= trialExpiry || !!user.plan;
  }

  async create(userId: string, createQRCodeDto: CreateQRCodeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // UsageGuard already checks limits, but we check overall account status here
    if (!this.isAccessActive(user)) {
      throw new ForbiddenException(
        'Your access has expired or is inactive. Please upgrade your plan to continue.',
      );
    }

    const shortId = crypto.randomBytes(4).toString('hex');

    const { data, design, frame, linkedQRCodeId, ...rest } = createQRCodeDto;

    // Auto-sync linkedQRCodeId from JSON if not explicitly provided
    const syncedLinkedId = linkedQRCodeId || this.extractLinkedQRId(data);

    const qrCode = await this.prisma.qRCode.create({
      data: {
        ...rest,
        userId,
        shortId,
        data: data as Prisma.InputJsonValue,
        design: design as Prisma.InputJsonValue,
        frame: frame as Prisma.InputJsonValue,
        linkedQRCodeId: syncedLinkedId,
      },
    });

    // Synchronize with the Form table for lead-capture types
    const leadTypes = ['form', 'menu', 'booking'];
    const qrType = String(qrCode.type);
    if (leadTypes.includes(qrType)) {
      let title = 'Untitled Form';
      let description = '';
      let fields = [];

      const qrData = data as any;
      if (qrType === 'form' && qrData?.form) {
        title = qrData.form.title || title;
        description = qrData.form.description || '';
        fields = qrData.form.fields || [];
      } else if (qrType === 'menu') {
        const menuData = qrData?.menu || qrData;
        title = menuData?.restaurantName || title;
        description = menuData?.description || '';
        fields = menuData?.customFields || [];
      } else if (qrType === 'booking') {
        const bookingData = qrData?.booking || qrData;
        title = bookingData?.title || bookingData?.businessName || title;
        description = bookingData?.description || '';
        fields = bookingData?.customFormFields || [];
      }

      await this.formsService.createOrUpdateForm(userId, {
        qrCodeId: qrCode.id,
        title,
        description,
        fields,
      });
    }

    return qrCode;
  }

  async findAll(
    userId: string,
    filters: {
      status?: string;
      folderId?: string;
      type?: string;
      search?: string;
    } = {},
  ) {
    const { status, folderId, type, search } = filters;

    return this.prisma.qRCode.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
        ...(folderId && { folderId }),
        ...(type && { type: type as any }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: {
          select: { scans: true },
        },
        form: {
          select: {
            _count: {
              select: { submissions: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const qrCode = await this.prisma.qRCode.findFirst({
      where: { id, userId },
      include: {
        scans: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException(`QR Code with ID ${id} not found`);
    }

    return qrCode;
  }

  async getScans(id: string, userId: string) {
    const qrCode = await this.prisma.qRCode.findFirst({
      where: { id, userId },
    });

    if (!qrCode) {
      throw new NotFoundException(`QR Code with ID ${id} not found`);
    }

    return this.prisma.scan.findMany({
      where: { qrCodeId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, updateQRCodeDto: UpdateQRCodeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user || !this.isAccessActive(user)) {
      throw new ForbiddenException(
        'Your access has expired. Please upgrade your plan to continue.',
      );
    }

    const qrCode = await this.findOne(id, userId);

    const { data, design, frame, linkedQRCodeId, ...rest } = updateQRCodeDto;

    // Auto-sync linkedQRCodeId from JSON if it was updated or if we are forced to re-extract
    const syncedLinkedId =
      linkedQRCodeId !== undefined
        ? linkedQRCodeId
        : data !== undefined
          ? this.extractLinkedQRId(data)
          : undefined;

    const updated = await this.prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        ...rest,
        data: data === undefined ? undefined : (data as Prisma.InputJsonValue),
        design:
          design === undefined ? undefined : (design as Prisma.InputJsonValue),
        frame:
          frame === undefined ? undefined : (frame as Prisma.InputJsonValue),
        linkedQRCodeId: syncedLinkedId,
      },
    });

    // Synchronize with the Form table for lead-capture types
    const leadTypes = ['form', 'menu', 'booking'];
    const qrType = String(updated.type);
    if (leadTypes.includes(qrType)) {
      let title = 'Untitled Form';
      let description = '';
      let fields = [];

      const qrData = (data || updated.data) as any;
      if (qrType === 'form' && qrData?.form) {
        title = qrData.form.title || title;
        description = qrData.form.description || '';
        fields = qrData.form.fields || [];
      } else if (qrType === 'menu') {
        const menuData = qrData?.menu || qrData;
        title = menuData?.restaurantName || title;
        description = menuData?.description || '';
        fields = menuData?.customFields || [];
      } else if (qrType === 'booking') {
        const bookingData = qrData?.booking || qrData;
        title = bookingData?.title || bookingData?.businessName || title;
        description = bookingData?.description || '';
        fields = bookingData?.customFormFields || [];
      }

      await this.formsService.createOrUpdateForm(userId, {
        qrCodeId: updated.id,
        title,
        description,
        fields,
      });
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    const qrCode = await this.findOne(id, userId);

    // Delete associated files from Cloudinary
    await this.deleteCloudinaryFiles(qrCode);

    return this.prisma.qRCode.delete({
      where: { id: qrCode.id },
    });
  }

  private extractCloudinaryUrls(obj: any): string[] {
    const urls: string[] = [];
    if (!obj) return urls;

    if (typeof obj === 'string') {
      if (obj.includes('cloudinary.com') && obj.includes('qr-thrive/')) {
        urls.push(obj);
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        urls.push(...this.extractCloudinaryUrls(item));
      }
    } else if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        urls.push(...this.extractCloudinaryUrls(obj[key]));
      }
    }
    return urls;
  }

  private extractPublicIdFromUrl(url: string): string | null {
    if (
      !url ||
      typeof url !== 'string' ||
      !url.includes('cloudinary.com') ||
      !url.includes('qr-thrive/')
    )
      return null;
    const startIndex = url.indexOf('qr-thrive/');
    if (startIndex === -1) return null;

    const publicIdWithExt = url.substring(startIndex);
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    return publicIdWithExt;
  }

  private async deleteCloudinaryFiles(qrCode: any) {
    if (!qrCode) return;

    const urls = [
      ...this.extractCloudinaryUrls(qrCode.data),
      ...this.extractCloudinaryUrls(qrCode.logo),
    ];

    const publicIds = urls
      .map((url) => this.extractPublicIdFromUrl(url))
      .filter((id): id is string => id !== null);

    const uniquePublicIds = [...new Set(publicIds)];

    for (const publicId of uniquePublicIds) {
      await this.uploadService.deleteFile(publicId);
    }
  }

  /**
   * Recursively searches for 'qrLinkId' within the dynamic data JSON.
   */
  private extractLinkedQRId(data: any): string | null {
    if (!data || typeof data !== 'object') return null;

    if (Array.isArray(data)) {
      for (const item of data) {
        const found = this.extractLinkedQRId(item);
        if (found) return found;
      }
    } else {
      for (const key of Object.keys(data)) {
        if (
          (key === 'qrLinkId' ||
            key === 'connectedQrId' ||
            key === 'linkedQRCodeId') &&
          typeof data[key] === 'string'
        ) {
          return data[key];
        }
        // Recursively check nested objects/arrays
        const found = this.extractLinkedQRId(data[key]);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * One-time sync for legacy QR codes that have qrLinkId in JSON but not in DB field.
   */
  async syncLegacyQRLinks() {
    const qrCodes = await this.prisma.qRCode.findMany({
      where: {
        linkedQRCodeId: null,
      },
    });

    let syncCount = 0;
    for (const qr of qrCodes) {
      const extractedId = this.extractLinkedQRId(qr.data);
      if (extractedId) {
        // Verify the linked QR code exists to maintain integrity
        const exists = await this.prisma.qRCode.findUnique({
          where: { id: extractedId },
        });
        if (exists) {
          await this.prisma.qRCode.update({
            where: { id: qr.id },
            data: { linkedQRCodeId: extractedId },
          });
          syncCount++;
        }
      }
    }
    return { syncCount };
  }

  async duplicate(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });
    if (!user || !this.isAccessActive(user)) {
      throw new ForbiddenException(
        'Your access has expired. Please upgrade your plan to continue.',
      );
    }

    const original = await this.findOne(id, userId);
    const shortId = crypto.randomBytes(4).toString('hex');

    // Destructure to remove fields that shouldn't be copied
    const {
      id: _,
      createdAt: __,
      updatedAt: ___,
      clicks: ____,
      shortId: _____,
      scans: ______,
      ...rest
    } = original;

    return this.prisma.qRCode.create({
      data: {
        ...(rest as any), // Cast rest to any for Prisma create compatibility with Json fields
        name: `${original.name} (Copy)`,
        shortId,
        data: original.data as Prisma.InputJsonValue,
        design: original.design as Prisma.InputJsonValue,
        frame: original.frame as Prisma.InputJsonValue,
      },
    });
  }

  async findOneByShortId(shortId: string) {
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { shortId },
      include: {
        user: { include: { plan: true } },
        form: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
        linkedQRCode: true,
      },
    });

    if (!qrCode) {
      throw new NotFoundException(`QR Code with shortId ${shortId} not found`);
    }

    if (!this.isAccessActive(qrCode.user)) {
      throw new ForbiddenException(
        'This QR code is currently disabled. Owner subscription expired.',
      );
    }

    // If it's a form type and we have relational form data, sync it back into the 'data' field
    // so the frontend receives the correct database IDs (CUIDs)
    if (qrCode.type === 'form' && qrCode.form) {
      const data = qrCode.data as Record<string, any>;
      if (data && data.form) {
        data.form.fields = qrCode.form.fields.map((f) => ({
          id: f.id,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder,
          helpText: f.helpText,
          required: f.required,
          options: f.options,
          validation: f.validation,
        }));
      }
    }

    return qrCode;
  }

  async recordScan(shortId: string, ip: string, userAgent: string) {
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { shortId },
      include: {
        user: { include: { plan: true } },
        linkedQRCode: true,
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR Code not found');
    }

    if (!this.isAccessActive(qrCode.user)) {
      throw new ForbiddenException(
        'This QR code is currently disabled. Owner subscription expired.',
      );
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const geo = geoip.lookup(ip);

    if (!geo) {
      console.log(`[QRCodesService] No geo data found for IP: ${ip}`);
    }

    await this.prisma.$transaction([
      this.prisma.qRCode.update({
        where: { id: qrCode.id },
        data: { clicks: { increment: 1 } },
      }),
      this.prisma.scan.create({
        data: {
          qrCodeId: qrCode.id,
          ip,
          userAgent,
          browser: result.browser.name || 'unknown',
          os: result.os.name || 'unknown',
          device: result.device.type || 'desktop',
          city: geo?.city || null,
          country: geo?.country || null,
          region: geo?.region || null,
        },
      }),
    ]);
    
    // Trigger push notification if owner has opted in
    if (qrCode.user.scanNotificationsEnabled) {
      this.pushService.sendPushNotification(qrCode.userId, {
        title: 'QR Code Scanned',
        body: `Your QR code "${qrCode.name}" was just scanned.`,
        url: `/dashboard/stats?id=${qrCode.id}`,
      }).catch(err => {
        // Silently fail notification errors to not break the scan redirect
        console.error('[QRCodesService] Push notification failed:', err);
      });
    }

    return qrCode;
  }

  async getStats(userId: string, startDate?: string, endDate?: string) {
    const qrCodes = await this.prisma.qRCode.findMany({
      where: { userId },
      select: { id: true, name: true },
    });

    const qrCodeIds = qrCodes.map((qr) => qr.id);

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const scans = await this.prisma.scan.findMany({
      where: {
        qrCodeId: { in: qrCodeIds },
        ...dateFilter,
      },
    });

    const totalScans = scans.length;
    const uniqueVisitors = new Set(
      scans.map((s) => `${s.ip}-${s.userAgent}`).filter(Boolean),
    ).size;

    const scansByDate: Record<string, number> = {};
    const scansByCountry: Record<string, number> = {};
    const scansByCity: Record<string, number> = {};
    const qrCodeScanCounts: Record<string, number> = {};

    scans.forEach((scan) => {
      const date = scan.createdAt.toISOString().split('T')[0];
      scansByDate[date] = (scansByDate[date] || 0) + 1;

      if (scan.country) {
        scansByCountry[scan.country] = (scansByCountry[scan.country] || 0) + 1;
      }

      if (scan.city) {
        scansByCity[scan.city] = (scansByCity[scan.city] || 0) + 1;
      }

      qrCodeScanCounts[scan.qrCodeId] = (qrCodeScanCounts[scan.qrCodeId] || 0) + 1;
    });

    const topQrCodes = qrCodes
      .map((qr) => ({
        qrCodeId: qr.id,
        name: qr.name,
        scans: qrCodeScanCounts[qr.id] || 0,
      }))
      .filter((qr) => qr.scans > 0)
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 10);

    return {
      totalScans,
      uniqueVisitors,
      scansByDate: Object.entries(scansByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      scansByCountry: Object.entries(scansByCountry)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
      scansByCity: Object.entries(scansByCity)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      topQrCodes,
    };
  }
}
