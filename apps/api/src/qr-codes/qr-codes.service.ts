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

const TRIAL_DAYS = 7;

@Injectable()
export class QRCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly formsService: FormsService,
    private readonly uploadService: UploadService,
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
      include: { plan: true }
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

    const { data, design, frame, ...rest } = createQRCodeDto;

    const qrCode = await this.prisma.qRCode.create({
      data: {
        ...rest,
        userId,
        shortId,
        data: data as Prisma.InputJsonValue,
        design: design as Prisma.InputJsonValue,
        frame: frame as Prisma.InputJsonValue,
      },
    });

    // If it's a form type, synchronize with the Form table
    if (qrCode.type === 'form' && data && (data as { form?: any }).form) {
      const formData = (data as { form: any }).form;
      await this.formsService.createOrUpdateForm(userId, {
        qrCodeId: qrCode.id,
        title: formData.title || 'Untitled Form',
        description: formData.description,
        fields: formData.fields || [],
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
      include: { plan: true }
    });

    if (!user || !this.isAccessActive(user)) {
      throw new ForbiddenException(
        'Your access has expired. Please upgrade your plan to continue.',
      );
    }

    const qrCode = await this.findOne(id, userId);

    const { data, design, frame, ...rest } = updateQRCodeDto;

    const updated = await this.prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        ...rest,
        data: data === undefined ? undefined : (data as Prisma.InputJsonValue),
        design:
          design === undefined ? undefined : (design as Prisma.InputJsonValue),
        frame:
          frame === undefined ? undefined : (frame as Prisma.InputJsonValue),
      },
    });

    // If it's a form type, synchronize with the Form table
    if (updated.type === 'form' && data && (data as { form?: any }).form) {
      const formData = (data as { form: any }).form;
      await this.formsService.createOrUpdateForm(userId, {
        qrCodeId: updated.id,
        title: formData.title || 'Untitled Form',
        description: formData.description,
        fields: formData.fields || [],
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

  async duplicate(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { plan: true }
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
      include: { user: { include: { plan: true } } },
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

    return qrCode;
  }

  async getStats(userId: string) {
    const qrCodes = await this.prisma.qRCode.findMany({
      where: { userId },
      include: {
        scans: true,
      },
    });

    const totalQRs = qrCodes.length;
    const totalScans = qrCodes.reduce((acc, qr) => acc + qr.clicks, 0);

    // Unique visitors based on IP + User Agent across all QRs
    const uniqueVisitorsMap = new Set<string>();
    qrCodes.forEach((qr) => {
      qr.scans.forEach((scan) => {
        uniqueVisitorsMap.add(`${scan.ip}-${scan.userAgent}`);
      });
    });
    const uniqueVisitors = uniqueVisitorsMap.size;

    // Device distribution
    const deviceDist: Record<string, number> = {};
    // OS distribution
    const osDist: Record<string, number> = {};
    // Browser distribution
    const browserDist: Record<string, number> = {};
    // Country distribution
    const countryDist: Record<string, number> = {};
    // Time distribution (0-23 hours)
    const timeDist: Record<string, number> = {};

    const oneHourAgo = new Date(Date.now() - 3600000);
    let scansLastHour = 0;

    qrCodes.forEach((qr) => {
      qr.scans.forEach((scan) => {
        const d = scan.device || 'desktop';
        deviceDist[d] = (deviceDist[d] || 0) + 1;

        const o = scan.os || 'unknown';
        osDist[o] = (osDist[o] || 0) + 1;

        const b = scan.browser || 'unknown';
        browserDist[b] = (browserDist[b] || 0) + 1;

        const c = scan.country || 'Unknown';
        countryDist[c] = (countryDist[c] || 0) + 1;

        const hour = scan.createdAt.getHours().toString();
        timeDist[hour] = (timeDist[hour] || 0) + 1;

        if (scan.createdAt >= oneHourAgo) {
          scansLastHour++;
        }
      });
    });

    // Time-based data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const chartData = last7Days.map((date) => {
      let scans = 0;
      const unique = new Set<string>();
      qrCodes.forEach((qr) => {
        qr.scans.forEach((scan) => {
          if (scan.createdAt.toISOString().split('T')[0] === date) {
            scans++;
            unique.add(`${scan.ip}-${scan.userAgent}`);
          }
        });
      });
      return { name: date, scans, unique: unique.size };
    });

    return {
      totalQRs,
      totalScans,
      uniqueVisitors,
      scansLastHour,
      deviceDist,
      osDist,
      browserDist,
      countryDist,
      timeDist,
      chartData,
    };
  }
}
