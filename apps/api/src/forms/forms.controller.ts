import { Controller, Get, Post, Body, Put, Param, Req, UseGuards } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':qrCodeId')
  async getForm(@Req() req: RequestWithUser, @Param('qrCodeId') qrCodeId: string) {
    return this.formsService.getFormByQRCode(qrCodeId, req.user.userId);
  }

  @Post()
  async createOrUpdateForm(@Req() req: RequestWithUser, @Body() createFormDto: CreateFormDto) {
    return this.formsService.createOrUpdateForm(req.user.userId, createFormDto);
  }

  @Get(':qrCodeId/submissions')
  async getSubmissions(@Req() req: RequestWithUser, @Param('qrCodeId') qrCodeId: string) {
    return this.formsService.getSubmissions(qrCodeId, req.user.userId);
  }
}
