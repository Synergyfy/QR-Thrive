import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

class SignedUrlDto {
  @IsString()
  fileType: 'image' | 'video' | 'audio' | 'pdf' | 'logo';

  @IsString()
  fileName: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  fileSize: number;
}

class UploadFileDto {
  @IsString()
  fileType: 'image' | 'video' | 'audio' | 'pdf' | 'logo';
}

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  private isAccessActive(user: User): boolean {
    if (user.plan === 'PRO') return true;

    const TRIAL_DAYS = 7;
    const now = new Date();
    const trialExpiry = new Date(user.createdAt);
    trialExpiry.setDate(trialExpiry.getDate() + TRIAL_DAYS);

    return now <= trialExpiry;
  }

  @Post('signed-url')
  async getSignedUrl(
    @Req() req: { user: { userId: string } },
    @Body() dto: SignedUrlDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (dto.fileType !== 'logo' && (!user || !this.isAccessActive(user))) {
      throw new ForbiddenException(
        'Your trial has expired. Please upgrade to PRO to continue uploading files.',
      );
    }

    try {
      return await this.uploadService.getSignedUploadUrl(
        dto.fileType,
        dto.fileName,
        dto.fileSize,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: { user: { userId: string } },
    @Body() dto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (dto.fileType !== 'logo' && (!user || !this.isAccessActive(user))) {
      throw new ForbiddenException(
        'Your trial has expired. Please upgrade to PRO to continue uploading files.',
      );
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }
    try {
      return await this.uploadService.uploadFile(
        dto.fileType,
        file.originalname,
        file.buffer,
        file.mimetype,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('file/:publicId')
  async deleteFile(@Param('publicId') publicId: string) {
    try {
      await this.uploadService.deleteFile(publicId);
      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
