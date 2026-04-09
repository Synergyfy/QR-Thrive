import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('signature')
  async getSignature(@Req() req: RequestWithUser) {
    return this.mediaService.getSignature('public_uploads');
  }

  @Patch(':id')
  async updateMedia(
    @Param('id') id: string,
    @Body('secureUrl') secureUrl: string,
    @Req() req: RequestWithUser,
  ) {
    return this.mediaService.updateQRCodeMedia(id, req.user.userId, secureUrl);
  }
}
