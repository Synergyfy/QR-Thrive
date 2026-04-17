import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('Forms')
@ApiBearerAuth('JWT-auth')
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':qrCodeId')
  @ApiOperation({ summary: 'Get form details by QR code ID' })
  @ApiParam({
    name: 'qrCodeId',
    description: 'The unique identifier of the QR code',
  })
  @ApiResponse({ status: 200, description: 'Form details retrieved.' })
  @ApiResponse({ status: 404, description: 'Form not found for this QR code.' })
  async getForm(
    @Req() req: RequestWithUser,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.formsService.getFormByQRCode(qrCodeId, req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a form for a specific QR code' })
  @ApiResponse({
    status: 200,
    description: 'Form created or updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async createOrUpdateForm(
    @Req() req: RequestWithUser,
    @Body() createFormDto: CreateFormDto,
  ) {
    return this.formsService.createOrUpdateForm(req.user.userId, createFormDto);
  }

  @Get(':qrCodeId/submissions')
  @ApiOperation({ summary: 'Get all submissions for a specific form' })
  @ApiParam({
    name: 'qrCodeId',
    description: 'The unique identifier of the QR code linked to the form',
  })
  @ApiResponse({
    status: 200,
    description: 'List of form submissions retrieved.',
  })
  async getSubmissions(
    @Req() req: RequestWithUser,
    @Param('qrCodeId') qrCodeId: string,
  ) {
    return this.formsService.getSubmissions(qrCodeId, req.user.userId);
  }
}
