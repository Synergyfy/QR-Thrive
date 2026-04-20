import { Controller, Get, Patch, Body, Param, Req } from '@nestjs/common';
import { MediaService } from './media.service';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('Media')
@ApiBearerAuth('JWT-auth')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('signature')
  @ApiOperation({
    summary: 'Get a signed URL signature for Cloudinary uploads',
  })
  @ApiResponse({
    status: 200,
    description: 'Signature retrieved successfully.',
  })
  async getSignature(@Req() req: RequestWithUser) {
    return this.mediaService.getSignature('public_uploads');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media URL for a specific QR code' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the QR code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        secureUrl: {
          type: 'string',
          example: 'https://cloudinary.com/image.png',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Media URL updated.' })
  @ApiResponse({ status: 404, description: 'QR code not found.' })
  async updateMedia(
    @Param('id') id: string,
    @Body('secureUrl') secureUrl: string,
    @Req() req: RequestWithUser,
  ) {
    return this.mediaService.updateQRCodeMedia(id, req.user.userId, secureUrl);
  }
}
