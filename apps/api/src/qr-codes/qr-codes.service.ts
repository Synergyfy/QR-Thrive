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
import { VemtapAuthService } from '../integration/vemtap-auth.service';
import { Inject, forwardRef } from '@nestjs/common';
import type { VemTapSubscriptionPayload } from '../integration/vemtap-subscription.guard';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

const TRIAL_DAYS = 7;

@Injectable()
export class QRCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly formsService: FormsService,
    private readonly uploadService: UploadService,
    private readonly pushService: PushService,
    @Inject(forwardRef(() => VemtapAuthService))
    private readonly vemtapAuthService: VemtapAuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Checks if the user's access is active.
   * Logic:
   * 1. If VemTap subscription token is provided (VemTap-proxied requests), trust VemTap's validation
   * 2. If they have a managedSubscriptionToken, verify it
   * 3. If they have a plan that isn't the 'Free' plan (non-default), they are active.
   * 4. If they have the default 'Free' plan, we might have a trial logic or just allow it within limits.
   * Note: UsageGuard handles the actual limits (counts and types).
   */
  private async isAccessActive(
    user: User & { plan?: Plan | null },
    vemtapSubscription?: VemTapSubscriptionPayload,
  ): Promise<boolean> {
    if (vemtapSubscription) {
      return true;
    }

    // 1. Check for Managed Subscription Assertion (VemTap)
    if (user.managedSubscriptionToken) {
      try {
        const assertion = this.vemtapAuthService.verifyAssertion(user.managedSubscriptionToken);
        if (assertion.status === 'active') {
          return true;
        }
        console.warn(`[QRCodesService] Assertion for user ${user.id} is not 'active' (status: ${assertion.status}). Falling back to plan check.`);
      } catch (e) {
        console.warn(`[QRCodesService] Managed token verification failed for user ${user.id}: ${e.message}. Falling back to plan check.`);
      }
    }

    // 2. Check for Paid Plan
    if (user.plan && !user.plan.isDefault) {
      return true;
    }

    // 3. Check for Active Trial
    const now = new Date();
    const trialExpiry = new Date(user.createdAt);
    trialExpiry.setDate(trialExpiry.getDate() + TRIAL_DAYS);

    if (now <= trialExpiry) {
      return true;
    }

    // 4. If we reach here, and they have the default plan, it means they are post-trial on a free account
    // We only allow this if the system is configured to allow free access (!!user.plan)
    if (user.plan) {
      return true; 
    }

    console.error(`[QRCodesService] Access Denied: User ${user.id} has no valid subscription, no paid plan, and trial expired on ${trialExpiry.toISOString()}.`);
    return false;
  }

  async create(userId: string, createQRCodeDto: CreateQRCodeDto, vemtapSubscription?: VemTapSubscriptionPayload, cachedUser?: User & { plan?: Plan | null }) {
    const user = cachedUser || await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // UsageGuard already checks limits, but we check overall account status here
    if (!(await this.isAccessActive(user, vemtapSubscription))) {
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

  async update(id: string, userId: string, updateQRCodeDto: UpdateQRCodeDto, vemtapSubscription?: VemTapSubscriptionPayload, cachedUser?: User & { plan?: Plan | null }) {
    const user = cachedUser || await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user || !(await this.isAccessActive(user, vemtapSubscription))) {
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

    // Invalidate public caches for this QR code
    await Promise.all([
      this.cacheManager.del(`qrcode:shortid:${updated.shortId}:native`),
      this.cacheManager.del(`qrcode:shortid:${updated.shortId}:vemtap`),
      this.cacheManager.del(`user:stats:${userId}:all:all`),
    ]).catch((err) => {
      console.error('[QRCodesService] Failed to clear update cache:', err);
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const qrCode = await this.findOne(id, userId);

    // Delete associated files from Cloudinary
    await this.deleteCloudinaryFiles(qrCode);

    const deleted = await this.prisma.qRCode.delete({
      where: { id: qrCode.id },
    });

    // Invalidate public caches for this QR code
    await Promise.all([
      this.cacheManager.del(`qrcode:shortid:${qrCode.shortId}:native`),
      this.cacheManager.del(`qrcode:shortid:${qrCode.shortId}:vemtap`),
      this.cacheManager.del(`user:stats:${userId}:all:all`),
    ]).catch((err) => {
      console.error('[QRCodesService] Failed to clear delete cache:', err);
    });

    return deleted;
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

    await Promise.all(uniquePublicIds.map((id) => this.uploadService.deleteFile(id)));
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

    // Extract linked IDs, then verify all in one batch query
    const extractedPairs: { qrId: string; linkedId: string }[] = [];
    for (const qr of qrCodes) {
      const extractedId = this.extractLinkedQRId(qr.data);
      if (extractedId) {
        extractedPairs.push({ qrId: qr.id, linkedId: extractedId });
      }
    }

    if (extractedPairs.length === 0) return { syncCount: 0 };

    // Batch-verify existence of all linked QR codes
    const linkedIds = extractedPairs.map((p) => p.linkedId);
    const existing = await this.prisma.qRCode.findMany({
      where: { id: { in: linkedIds } },
      select: { id: true },
    });
    const existingSet = new Set(existing.map((e) => e.id));

    // Parallel updates for valid pairs
    const results = await Promise.all(
      extractedPairs
        .filter((p) => existingSet.has(p.linkedId))
        .map((p) =>
          this.prisma.qRCode.update({
            where: { id: p.qrId },
            data: { linkedQRCodeId: p.linkedId },
          }),
        ),
    );

    return { syncCount: results.length };
  }

  async duplicate(id: string, userId: string, vemtapSubscription?: VemTapSubscriptionPayload, cachedUser?: User & { plan?: Plan | null }) {
    const user = cachedUser || await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });
    if (!user || !(await this.isAccessActive(user, vemtapSubscription))) {
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

  async findOneByShortId(shortId: string, vemtapSubscription?: VemTapSubscriptionPayload) {
    const cacheKey = `qrcode:shortid:${shortId}:${vemtapSubscription ? 'vemtap' : 'native'}`;
    const cachedQR = await this.cacheManager.get<any>(cacheKey);
    if (cachedQR) {
      return cachedQR;
    }

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

    if (!(await this.isAccessActive(qrCode.user, vemtapSubscription))) {
      throw new ForbiddenException(
        'This QR code is currently disabled. Please contact the owner.',
      );
    }

    // If it's a lead-capture type and we have relational form data, sync it back into the 'data' field
    // so the frontend receives the correct database IDs (CUIDs)
    const leadTypes = ['form', 'menu', 'booking'];
    const qrType = String(qrCode.type);
    if (leadTypes.includes(qrType) && qrCode.form) {
      const data = qrCode.data as Record<string, any>;
      if (data) {
        const fields = qrCode.form.fields.map((f) => ({
          id: f.id,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder,
          helpText: f.helpText,
          required: f.required,
          options: f.options,
          validation: f.validation,
        }));

        if (qrType === 'form' && data.form) {
          data.form.fields = fields;
        } else if (qrType === 'menu' && data.menu) {
          data.menu.customFields = fields;
        } else if (qrType === 'booking' && data.booking) {
          data.booking.customFormFields = fields;
        }
      }
    }

    // Cache dynamic resolution for 5 minutes (300 seconds)
    await this.cacheManager.set(cacheKey, qrCode, 300);

    return qrCode;
  }

  async recordScan(shortId: string, ip: string, userAgent: string, vemtapSubscription?: VemTapSubscriptionPayload) {
    const cacheKey = `qrcode:shortid:${shortId}:${vemtapSubscription ? 'vemtap' : 'native'}`;
    let qrCode = await this.cacheManager.get<any>(cacheKey);

    if (!qrCode) {
      qrCode = await this.prisma.qRCode.findUnique({
        where: { shortId },
        include: {
          user: { include: { plan: true } },
          linkedQRCode: true,
        },
      });

      if (!qrCode) {
        throw new NotFoundException('QR Code not found');
      }

      await this.cacheManager.set(cacheKey, qrCode, 300);
    }

    if (!(await this.isAccessActive(qrCode.user, vemtapSubscription))) {
      throw new ForbiddenException(
        'This QR code is currently disabled. Please contact the owner.',
      );
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const geo = geoip.lookup(ip);

    if (!geo) {
      console.log(`[QRCodesService] No geo data found for IP: ${ip}`);
    }

    // Create standard Scan record (blocking insert, fast)
    await this.prisma.scan.create({
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
    });

    // Decouple clicks increment to run asynchronously in the background.
    // This entirely bypasses database row locks and queue latency under heavy load.
    this.prisma.qRCode.update({
      where: { id: qrCode.id },
      data: { clicks: { increment: 1 } },
    }).catch(err => {
      console.error(`[QRCodesService] Failed to increment clicks for ${qrCode.id}:`, err);
    });
    
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
    const cacheKey = `user:stats:${userId}:${startDate || 'all'}:${endDate || 'all'}`;
    const cachedStats = await this.cacheManager.get<any>(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    const qrCodes = await this.prisma.qRCode.findMany({
      where: { userId },
      select: { id: true, name: true },
    });

    if (qrCodes.length === 0) {
      return {
        totalQrCodes: 0,
        totalScans: 0,
        uniqueVisitors: 0,
        scansByDate: [],
        scansByCountry: [],
        scansByCity: [],
        topQrCodes: [],
      };
    }

    const qrCodeIds = qrCodes.map((qr) => qr.id);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Use database-level aggregation for all stats
    const [totalScansResult, scansByDateResult, scansByCountryResult, scansByCityResult, topQrCodesResult, uniqueVisitorsResult] = await Promise.all([
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count FROM "Scan"
        WHERE "qrCodeId" = ANY(${qrCodeIds}::uuid[])
          AND (${start}::timestamptz IS NULL OR "createdAt" >= ${start}::timestamptz)
          AND (${end}::timestamptz IS NULL OR "createdAt" <= ${end}::timestamptz)
      `,
      this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
        FROM "Scan"
        WHERE "qrCodeId" = ANY(${qrCodeIds}::uuid[])
          AND (${start}::timestamptz IS NULL OR "createdAt" >= ${start}::timestamptz)
          AND (${end}::timestamptz IS NULL OR "createdAt" <= ${end}::timestamptz)
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      this.prisma.$queryRaw<{ country: string; count: bigint }[]>`
        SELECT country, COUNT(*)::bigint as count
        FROM "Scan"
        WHERE "qrCodeId" = ANY(${qrCodeIds}::uuid[]) AND country IS NOT NULL
          AND (${start}::timestamptz IS NULL OR "createdAt" >= ${start}::timestamptz)
          AND (${end}::timestamptz IS NULL OR "createdAt" <= ${end}::timestamptz)
        GROUP BY country
        ORDER BY count DESC
      `,
      this.prisma.$queryRaw<{ city: string; count: bigint }[]>`
        SELECT city, COUNT(*)::bigint as count
        FROM "Scan"
        WHERE "qrCodeId" = ANY(${qrCodeIds}::uuid[]) AND city IS NOT NULL
          AND (${start}::timestamptz IS NULL OR "createdAt" >= ${start}::timestamptz)
          AND (${end}::timestamptz IS NULL OR "createdAt" <= ${end}::timestamptz)
        GROUP BY city
        ORDER BY count DESC
        LIMIT 20
      `,
      this.prisma.$queryRaw<{ qrCodeId: string; count: bigint }[]>`
        SELECT "qrCodeId", COUNT(*)::bigint as count
        FROM "Scan"
        WHERE "qrCodeId" = ANY(${qrCodeIds}::uuid[])
          AND (${start}::timestamptz IS NULL OR "createdAt" >= ${start}::timestamptz)
          AND (${end}::timestamptz IS NULL OR "createdAt" <= ${end}::timestamptz)
        GROUP BY "qrCodeId"
        ORDER BY count DESC
        LIMIT 10
      `,
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT COALESCE(ip, ''))::bigint as count
        FROM "Scan"
        WHERE "qrCodeId" = ANY(${qrCodeIds}::uuid[])
          AND (${start}::timestamptz IS NULL OR "createdAt" >= ${start}::timestamptz)
          AND (${end}::timestamptz IS NULL OR "createdAt" <= ${end}::timestamptz)
      `,
    ]);

    const totalScans = Number(totalScansResult[0]?.count || 0);
    const uniqueVisitors = Number(uniqueVisitorsResult[0]?.count || 0);

    const qrCodeScanMap = new Map(topQrCodesResult.map((r) => [r.qrCodeId, Number(r.count)]));
    const topQrCodes = qrCodes
      .filter((qr) => qrCodeScanMap.has(qr.id))
      .sort((a, b) => (qrCodeScanMap.get(b.id) || 0) - (qrCodeScanMap.get(a.id) || 0))
      .slice(0, 10)
      .map((qr) => ({
        qrCodeId: qr.id,
        name: qr.name,
        scans: qrCodeScanMap.get(qr.id) || 0,
      }));

    const statsResult = {
      totalQrCodes: qrCodes.length,
      totalScans,
      uniqueVisitors,
      scansByDate: scansByDateResult.map((r) => ({ date: r.date, count: Number(r.count) })),
      scansByCountry: scansByCountryResult.map((r) => ({ country: r.country, count: Number(r.count) })),
      scansByCity: scansByCityResult.map((r) => ({ city: r.city, count: Number(r.count) })),
      topQrCodes,
    };

    // Cache user statistics for 2 minutes (120 seconds)
    await this.cacheManager.set(cacheKey, statsResult, 120);

    return statsResult;
  }
}
