import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface SignedUploadResponse {
  signedUrl: string;
  cloudinaryUrl: string;
  publicId: string;
}

const FILE_CONFIG = {
  image: {
    maxSize: 10 * 1024 * 1024,
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
  video: {
    maxSize: 50 * 1024 * 1024,
    extensions: ['mp4', 'mov', 'webm', 'avi'],
  },
  audio: {
    maxSize: 50 * 1024 * 1024,
    extensions: ['mp3', 'wav', 'ogg', 'm4a'],
  },
  pdf: { maxSize: 20 * 1024 * 1024, extensions: ['pdf'] },
  logo: {
    maxSize: 5 * 1024 * 1024,
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  },
};

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is missing');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async uploadFile(
    fileType: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<SignedUploadResponse> {
    const config = FILE_CONFIG[fileType as keyof typeof FILE_CONFIG];
    if (!config) {
      throw new Error(`Invalid file type: ${fileType}`);
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !config.extensions.includes(ext)) {
      throw new Error(
        `Invalid file extension. Allowed: ${config.extensions.join(', ')}`,
      );
    }

    const publicId = `qr-thrive/${fileType}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const resourceType =
      fileType === 'image' || fileType === 'logo' ? 'image' : 'raw';
    const folderName = `qr-thrive/${fileType}`;
    const uniquePublicId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: uniquePublicId,
          folder: folderName,
          resource_type: resourceType,
          use_filename: false,
          access_mode: 'public',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              signedUrl: '',
              cloudinaryUrl: result?.secure_url || '',
              publicId: result?.public_id || publicId,
            });
          }
        },
      );

      const stream = Readable.from(fileBuffer);
      stream.pipe(uploadStream);
    });
  }

  async getSignedUploadUrl(
    fileType: string,
    fileName: string,
    fileSize: number,
  ): Promise<SignedUploadResponse> {
    const config = FILE_CONFIG[fileType as keyof typeof FILE_CONFIG];
    if (!config) {
      throw new Error(`Invalid file type: ${fileType}`);
    }

    if (fileSize > config.maxSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${config.maxSize / 1024 / 1024}MB`,
      );
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !config.extensions.includes(ext)) {
      throw new Error(
        `Invalid file extension. Allowed: ${config.extensions.join(', ')}`,
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `qr-thrive/${fileType}/${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const resourceType =
      fileType === 'image' || fileType === 'logo' ? 'image' : 'auto';
    const folder = `qr-thrive/${fileType}`;

    const paramsToSign = {
      timestamp,
      folder,
      resource_type: resourceType,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.configService.get('CLOUDINARY_API_SECRET')!,
    );

    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME')!;
    const apiKey = this.configService.get('CLOUDINARY_API_KEY')!;

    const signedUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload?api_key=${apiKey}&timestamp=${timestamp}&signature=${signature}&folder=${folder}`;

    return {
      signedUrl,
      cloudinaryUrl: '',
      publicId,
    };
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }
}
