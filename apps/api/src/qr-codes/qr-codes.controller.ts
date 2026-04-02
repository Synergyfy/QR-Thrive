import { Controller, Get, Post, Body, Put, Param, Delete, Req, Query, Res } from '@nestjs/common';
import { QRCodesService } from './qr-codes.service';
import { CreateQRCodeDto } from './dto/create-qr-code.dto';
import { UpdateQRCodeDto } from './dto/update-qr-code.dto';
import { Public } from '../auth/decorators/public.decorator';
import type { Request, Response } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@Controller('qr-codes')
export class QRCodesController {
  constructor(private readonly qrCodesService: QRCodesService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() createQRCodeDto: CreateQRCodeDto) {
    return this.qrCodesService.create(req.user.userId, createQRCodeDto);
  }

  @Get()
  findAll(
    @Req() req: RequestWithUser,
    @Query('status') status?: string,
    @Query('folderId') folderId?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.qrCodesService.findAll(req.user.userId, { status, folderId, type, search });
  }

  @Get('stats')
  getStats(@Req() req: RequestWithUser) {
    return this.qrCodesService.getStats(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.qrCodesService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() updateQRCodeDto: UpdateQRCodeDto) {
    return this.qrCodesService.update(id, req.user.userId, updateQRCodeDto);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.qrCodesService.remove(id, req.user.userId);
  }

  @Post(':id/duplicate')
  duplicate(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.qrCodesService.duplicate(id, req.user.userId);
  }

  @Public()
  @Get('public/:shortId')
  async getPublic(@Param('shortId') shortId: string) {
    return this.qrCodesService.findOneByShortId(shortId);
  }

  // Public scan redirect endpoint
  @Public()
  @Get('scan/:shortId')
  async scan(
    @Param('shortId') shortId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    try {
      const qrCode = await this.qrCodesService.recordScan(shortId, ip, userAgent);
      
      // Determine destination from data
      const data = qrCode.data as any;
      let url = '/';

      if (qrCode.type === 'url' && data.url) {
        url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
      } else if (qrCode.type === 'whatsapp' && data.phoneNumber) {
        const message = data.message ? `?text=${encodeURIComponent(data.message)}` : '';
        url = `https://wa.me/${data.phoneNumber}${message}`;
      } else if (qrCode.type === 'form') {
        url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/s/${shortId}?scanned=1`;
      } else {
        // For other types (vcard, wifi, etc), we might redirect to a landing page
        // For now, let's just use a placeholder or the short URL logic
        url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/s/${shortId}?scanned=1`;
      }

      return res.redirect(url);
    } catch (error) {
      return res.status(404).send('QR Code not found');
    }
  }
}
