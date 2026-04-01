import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQRCodeDto } from './dto/create-qr-code.dto';
import { UpdateQRCodeDto } from './dto/update-qr-code.dto';
import * as crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import * as geoip from 'geoip-lite';

@Injectable()
export class QRCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createQRCodeDto: CreateQRCodeDto) {
    const shortId = crypto.randomBytes(4).toString('hex');
    
    const { data, design, frame, ...rest } = createQRCodeDto;

    return this.prisma.qRCode.create({
      data: {
        ...rest,
        userId,
        shortId,
        data: data as any,
        design: design as any,
        frame: frame as any,
      },
    });
  }

  async findAll(userId: string, filters: { status?: string; folderId?: string; type?: string; search?: string } = {}) {
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
          select: { scans: true }
        }
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
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!qrCode) {
      throw new NotFoundException(`QR Code with ID ${id} not found`);
    }

    return qrCode;
  }

  async update(id: string, userId: string, updateQRCodeDto: UpdateQRCodeDto) {
    const qrCode = await this.findOne(id, userId);
    
    const { data, design, frame, ...rest } = updateQRCodeDto;

    return this.prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        ...rest,
        data: data === undefined ? undefined : (data as any),
        design: design === undefined ? undefined : (design as any),
        frame: frame === undefined ? undefined : (frame as any),
      },
    });
  }

  async remove(id: string, userId: string) {
    const qrCode = await this.findOne(id, userId);

    return this.prisma.qRCode.delete({
      where: { id: qrCode.id },
    });
  }

  async duplicate(id: string, userId: string) {
    const original = await this.findOne(id, userId);
    const shortId = crypto.randomBytes(4).toString('hex');

    const { id: _, createdAt: __, updatedAt: ___, clicks: ____, shortId: _____, scans: ______, _count: _______, ...rest } = original as any;

    return this.prisma.qRCode.create({
      data: {
        ...rest,
        name: `${original.name} (Copy)`,
        shortId,
      },
    });
  }

  async recordScan(shortId: string, ip: string, userAgent: string) {
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { shortId },
    });

    if (!qrCode) {
      throw new NotFoundException('QR Code not found');
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const geo = geoip.lookup(ip);

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
          browser: result.browser.name,
          os: result.os.name,
          device: result.device.type || 'desktop',
          city: geo?.city,
          country: geo?.country,
          region: geo?.region,
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
    const uniqueVisitorsMap = new Set();
    qrCodes.forEach(qr => {
        qr.scans.forEach(scan => {
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

    qrCodes.forEach(qr => {
        qr.scans.forEach(scan => {
            const d = scan.device || 'desktop';
            deviceDist[d] = (deviceDist[d] || 0) + 1;
            
            const o = scan.os || 'unknown';
            osDist[o] = (osDist[o] || 0) + 1;

            const b = scan.browser || 'unknown';
            browserDist[b] = (browserDist[b] || 0) + 1;
        });
    });

    // Time-based data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const chartData = last7Days.map(date => {
        let scans = 0;
        let unique = new Set();
        qrCodes.forEach(qr => {
            qr.scans.forEach(scan => {
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
      deviceDist,
      osDist,
      browserDist,
      chartData,
    };
  }
}
