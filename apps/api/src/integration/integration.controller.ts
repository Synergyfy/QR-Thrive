import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Get,
  Logger,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { IntegrationService } from './integration.service';
import { IntegrationUserDto } from './dto/integration.dto';
import { QRCodesService } from '../qr-codes/qr-codes.service';
import { FormsService } from '../forms/forms.service';
import { CreateQRCodeDto } from '../qr-codes/dto/create-qr-code.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('External Integration')
@ApiHeader({
  name: 'X-API-KEY',
  description: 'Secure API key for external integration',
})
@Controller('integration')
@UseGuards(ApiKeyGuard)
@Public()
export class IntegrationController {
  private readonly logger = new Logger(IntegrationController.name);

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly qrCodesService: QRCodesService,
    private readonly formsService: FormsService,
  ) {}

  @Post('users')
  @ApiOperation({ summary: 'Ensure a user exists based on email' })
  @ApiResponse({ status: 201, description: 'User found or created.' })
  async ensureUser(@Body() dto: IntegrationUserDto) {
    return this.integrationService.ensureUser(dto);
  }

  @Post('users/:userId/magic-link')
  @ApiOperation({ summary: 'Generate a magic login link for a user' })
  @ApiResponse({ status: 201, description: 'Returns a single-use login URL.' })
  async generateMagicLink(@Param('userId') userId: string) {
    const url = await this.integrationService.generateMagicLink(userId);
    return { url };
  }

  @Post('users/:userId/qr-codes')
  @ApiOperation({ summary: 'Create a QR code on behalf of a user' })
  @ApiResponse({ status: 201, description: 'QR code successfully created.' })
  async createQRCode(
    @Param('userId') userId: string,
    @Body() dto: CreateQRCodeDto,
  ) {
    return this.qrCodesService.create(userId, dto);
  }

  @Get('users/:userId/qr-codes/:id')
  @ApiOperation({ summary: 'Get details of a specific QR code' })
  @ApiResponse({ status: 200, description: 'QR code details retrieved.' })
  async getQRCode(@Param('userId') userId: string, @Param('id') id: string) {
    // Try by shortId first
    const qrCode = await this.qrCodesService
      .findOneByShortId(id)
      .catch(() => null);
    
    if (qrCode && qrCode.userId === userId) return qrCode;

    // Otherwise try by UUID (internal ID) with userId restriction
    return this.qrCodesService.findOne(id, userId);
  }

  @Get('users/:userId/qr-codes/:id/scans')
  @ApiOperation({ summary: 'Get scan analytics for a specific QR code' })
  @ApiResponse({ status: 200, description: 'Scan records retrieved.' })
  async getScans(@Param('userId') userId: string, @Param('id') id: string) {
    return this.qrCodesService.getScans(id, userId);
  }

  @Get('users/:userId/qr-codes/:id/responses')
  @ApiOperation({ summary: 'Get form submissions for a specific QR code' })
  @ApiResponse({ status: 200, description: 'Form submissions retrieved.' })
  async getSubmissions(@Param('userId') userId: string, @Param('id') id: string) {
    return this.formsService.getSubmissions(id, userId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all active plans' })
  @ApiResponse({ status: 200, description: 'List of plans retrieved.' })
  async getPlans() {
    return this.integrationService.getPlans();
  }

  @Post('users/:userId/subscription')
  @ApiOperation({ summary: 'Set a user\'s plan/subscription' })
  @ApiResponse({ status: 200, description: 'User subscription updated.' })
  async setUserSubscription(
    @Param('userId') userId: string,
    @Body('planId') planId: string,
  ) {
    return this.integrationService.setUserSubscription(userId, planId);
  }
}
