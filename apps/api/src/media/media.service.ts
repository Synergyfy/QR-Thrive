import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  getSignature(folder: string = 'public_uploads') {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      this.configService.get('CLOUDINARY_API_SECRET')!,
    );

    return {
      signature,
      timestamp,
      folder,
      cloudName: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.configService.get('CLOUDINARY_API_KEY'),
    };
  }

  async updateQRCodeMedia(qrCodeId: string, userId: string, secureUrl: string) {
    const qrCode = await this.prisma.qRCode.findFirst({
      where: { id: qrCodeId, userId },
    });

    if (!qrCode) {
      throw new NotFoundException(`QR Code with ID ${qrCodeId} not found`);
    }

    const currentData = qrCode.data as any;

    // Update the data field with the new secure_url
    // Depending on the QR type, we might want to store it differently
    // But generic 'url' or 'fileUrl' is a good start.
    // The user mentioned videos, pdf, image, and mp3.
    const updatedData = {
      ...currentData,
      fileUrl: secureUrl,
      // Also potentially update specific fields based on type if needed
      ...(qrCode.type === 'image' && {
        image: { ...currentData?.image, url: secureUrl },
      }),
      ...(qrCode.type === 'video' && {
        video: { ...currentData?.video, url: secureUrl },
      }),
      ...(qrCode.type === 'pdf' && {
        pdf: { ...currentData?.pdf, url: secureUrl },
      }),
      ...(qrCode.type === 'mp3' && {
        mp3: { ...currentData?.mp3, url: secureUrl },
      }),
    };

    return this.prisma.qRCode.update({
      where: { id: qrCodeId },
      data: {
        data: updatedData,
      },
    });
  }
}
