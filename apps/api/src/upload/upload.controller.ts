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
import { User, Plan } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProperty,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

class SignedUrlDto {
  @ApiProperty({
    description: 'The type of file being uploaded',
    enum: ['image', 'video', 'audio', 'pdf', 'logo'],
    example: 'image',
  })
  @IsString()
  fileType: 'image' | 'video' | 'audio' | 'pdf' | 'logo';

  @ApiProperty({
    description: 'The original name of the file',
    example: 'profile-picture.png',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'The size of the file in bytes',
    example: 1024576,
  })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  fileSize: number;
}

class UploadFileDto {
  @ApiProperty({
    description: 'The type of file being uploaded',
    enum: ['image', 'video', 'audio', 'pdf', 'logo'],
    example: 'logo',
  })
  @IsString()
  fileType: 'image' | 'video' | 'audio' | 'pdf' | 'logo';
}

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  private isAccessActive(user: User & { plan?: Plan | null }): boolean {
    if (user.plan && !user.plan.isDefault) return true;

    const TRIAL_DAYS = 7;
    const now = new Date();
    const trialExpiry = new Date(user.createdAt);
    trialExpiry.setDate(trialExpiry.getDate() + TRIAL_DAYS);

    return now <= trialExpiry || !!user.plan;
  }

  @Post('signed-url')
  @ApiOperation({
    summary: 'Generate a signed upload URL for direct client-side upload',
  })
  @ApiResponse({
    status: 201,
    description: 'Signed URL generated successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - trial expired or insufficient permissions.',
  })
  async getSignedUrl(
    @Req() req: { user: { userId: string } },
    @Body() dto: SignedUrlDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { plan: true },
    });

    if (dto.fileType !== 'logo' && (!user || !this.isAccessActive(user))) {
      throw new ForbiddenException(
        'Your access has expired. Please upgrade your plan to continue uploading files.',
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
  @ApiOperation({ summary: 'Upload a file directly to the server' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileType: {
          type: 'string',
          enum: ['image', 'video', 'audio', 'pdf', 'logo'],
          example: 'image',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden - trial expired.' })
  async uploadFile(
    @Req() req: { user: { userId: string } },
    @Body() dto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { plan: true },
    });

    if (dto.fileType !== 'logo' && (!user || !this.isAccessActive(user))) {
      throw new ForbiddenException(
        'Your access has expired. Please upgrade your plan to continue uploading files.',
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
  @ApiOperation({ summary: 'Delete a previously uploaded file' })
  @ApiParam({
    name: 'publicId',
    description: 'The public identifier of the file to delete',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully.' })
  async deleteFile(@Param('publicId') publicId: string) {
    try {
      await this.uploadService.deleteFile(publicId);
      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
