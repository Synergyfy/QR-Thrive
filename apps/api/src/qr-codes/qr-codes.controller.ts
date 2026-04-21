import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
  Query,
  Res,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { QRCodesService } from './qr-codes.service';
import { CreateQRCodeDto } from './dto/create-qr-code.dto';
import { UpdateQRCodeDto } from './dto/update-qr-code.dto';
import { Public } from '../auth/decorators/public.decorator';
import { UsageGuard } from '../pricing/usage.guard';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('QR Codes')
@ApiBearerAuth('JWT-auth')
@Controller('qr-codes')
export class QRCodesController {
  constructor(private readonly qrCodesService: QRCodesService) {}

  @Post()
  @UseGuards(UsageGuard)
  @ApiOperation({ summary: 'Create a new QR code' })
  @ApiResponse({ status: 201, description: 'QR code created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({
    status: 403,
    description: 'Usage limit reached or QR type not allowed.',
  })
  create(
    @Req() req: RequestWithUser,
    @Body() createQRCodeDto: CreateQRCodeDto,
  ) {
    return this.qrCodesService.create(req.user.userId, createQRCodeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all QR codes for the current user' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (active, archived)',
  })
  @ApiQuery({
    name: 'folderId',
    required: false,
    description: 'Filter by folder ID',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by QR type' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or description',
  })
  @ApiResponse({ status: 200, description: 'List of QR codes retrieved.' })
  findAll(
    @Req() req: RequestWithUser,
    @Query('status') status?: string,
    @Query('folderId') folderId?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.qrCodesService.findAll(req.user.userId, {
      status,
      folderId,
      type,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get overall QR code statistics for the user' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully.',
  })
  getStats(@Req() req: RequestWithUser) {
    return this.qrCodesService.getStats(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific QR code by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the QR code' })
  @ApiResponse({ status: 200, description: 'QR code details retrieved.' })
  @ApiResponse({ status: 404, description: 'QR code not found.' })
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.qrCodesService.findOne(id, req.user.userId);
  }

  @Get(':id/scans')
  @ApiOperation({ summary: 'Get scan analytics for a specific QR code' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the QR code' })
  @ApiResponse({ status: 200, description: 'Scan analytics retrieved.' })
  getScans(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.qrCodesService.getScans(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a QR code' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the QR code' })
  @ApiResponse({ status: 200, description: 'QR code updated successfully.' })
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateQRCodeDto: UpdateQRCodeDto,
  ) {
    return this.qrCodesService.update(id, req.user.userId, updateQRCodeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a QR code (soft delete)' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the QR code' })
  @ApiResponse({ status: 200, description: 'QR code deleted successfully.' })
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.qrCodesService.remove(id, req.user.userId);
  }

  @Post(':id/duplicate')
  @UseGuards(UsageGuard)
  @ApiOperation({ summary: 'Duplicate an existing QR code' })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the QR code to duplicate',
  })
  @ApiResponse({ status: 201, description: 'QR code duplicated successfully.' })
  @ApiResponse({ status: 403, description: 'Usage limit reached.' })
  duplicate(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.qrCodesService.duplicate(id, req.user.userId);
  }

  @Public()
  @Get('public/:shortId')
  @ApiOperation({ summary: 'Get public details of a QR code by short ID' })
  @ApiParam({ name: 'shortId', description: 'The short ID of the QR code' })
  @ApiResponse({
    status: 200,
    description: 'Public QR code details retrieved.',
  })
  async getPublic(@Param('shortId') shortId: string) {
    return this.qrCodesService.findOneByShortId(shortId);
  }

  // Public scan redirect endpoint
  @Public()
  @Get('scan/:shortId')
  @ApiOperation({
    summary: 'Record a scan and redirect to the destination URL',
  })
  @ApiParam({
    name: 'shortId',
    description: 'The short ID of the QR code being scanned',
  })
  @ApiResponse({ status: 302, description: 'Redirecting to destination.' })
  @ApiResponse({ status: 404, description: 'QR code not found.' })
  async scan(
    @Param('shortId') shortId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    // If X-Forwarded-For contains multiple IPs, use the first one
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    // Normalize IPv6-mapped IPv4 addresses
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }

    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      const qrCode = await this.qrCodesService.recordScan(
        shortId,
        ip,
        userAgent,
      );

      // Determine destination from data
      const data = qrCode.data as any;
      let url = '/';

      let baseUrl = process.env.FRONTEND_URL;
      if (!baseUrl) {
        if (process.env.NODE_ENV === 'production') {
          const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'https';
          const host = req.headers['x-forwarded-host'] || req.get('host');
          baseUrl = `${scheme}://${host}`; // Dynamic host for production
        } else {
          baseUrl = 'http://localhost:5173'; // Fallback for local development
        }
      }

      if (qrCode.type === 'url' && data.url) {
        url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
      } else if (qrCode.type === 'whatsapp' && data.phoneNumber) {
        const message = data.message
          ? `?text=${encodeURIComponent(data.message)}`
          : '';
        url = `https://wa.me/${data.phoneNumber}${message}`;
      } else if (qrCode.type === 'form') {
        url = `${baseUrl}/s/${shortId}?scanned=1`;
      } else {
        // For other types (vcard, wifi, etc), we might redirect to a landing page
        // For now, let's just use a placeholder or the short URL logic
        url = `${baseUrl}/s/${shortId}?scanned=1`;
      }

      return res.redirect(url);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      return res.status(404).send('QR Code not found');
    }
  }
}
