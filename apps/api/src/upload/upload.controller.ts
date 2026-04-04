import { Controller, Post, Body, BadRequestException, Delete, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UploadService } from './upload.service';
import { IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';

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
  constructor(private readonly uploadService: UploadService) {}

  @Post('signed-url')
  async getSignedUrl(@Body() dto: SignedUrlDto) {
    try {
      return await this.uploadService.getSignedUploadUrl(dto.fileType, dto.fileName, dto.fileSize);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Body() dto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    try {
      return await this.uploadService.uploadFile(
        dto.fileType,
        file.originalname,
        file.buffer,
        file.mimetype
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
