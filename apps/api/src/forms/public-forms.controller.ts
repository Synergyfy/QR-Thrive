import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { FormsService } from './forms.service';
import { SubmitFormDto } from './dto/submit-form.dto';
import type { Request } from 'express';

@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Public()
  @Get(':shortId')
  async getPublicForm(@Param('shortId') shortId: string) {
    return this.formsService.getPublicForm(shortId);
  }

  @Public()
  @Post(':shortId/submit')
  async submitForm(
    @Param('shortId') shortId: string,
    @Body() submitDto: SubmitFormDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    return this.formsService.submitForm(shortId, submitDto, ip, userAgent);
  }
}
