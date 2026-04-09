import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { FormsService } from './forms.service';
import { SubmitFormDto } from './dto/submit-form.dto';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Public Forms')
@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Public()
  @Get(':shortId')
  @ApiOperation({ summary: 'Get public form configuration by QR short ID' })
  @ApiParam({ name: 'shortId', description: 'The short ID of the QR code linked to the form' })
  @ApiResponse({ status: 200, description: 'Public form configuration retrieved.' })
  @ApiResponse({ status: 404, description: 'Form not found.' })
  async getPublicForm(@Param('shortId') shortId: string) {
    return this.formsService.getPublicForm(shortId);
  }

  @Public()
  @Post(':shortId/submit')
  @ApiOperation({ summary: 'Submit answers to a public form' })
  @ApiParam({ name: 'shortId', description: 'The short ID of the QR code linked to the form' })
  @ApiResponse({ status: 201, description: 'Form submitted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid submission data.' })
  async submitForm(
    @Param('shortId') shortId: string,
    @Body() submitDto: SubmitFormDto,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.formsService.submitForm(shortId, submitDto, ip, userAgent);
  }
}
