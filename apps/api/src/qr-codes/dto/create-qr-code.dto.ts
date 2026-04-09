import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsInt,
  IsString,
} from 'class-validator';
import { QRType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQRCodeDto {
  @ApiProperty({
    description: 'Name of the QR code',
    example: 'Marketing Campaign 2024',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'A brief description of the QR code',
    example: 'QR code for summer campaign on Instagram',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID of the folder to store the QR code in',
    example: 'uuid-folder-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  folderId?: string;

  @ApiProperty({
    description: 'Type of QR code (Static or Dynamic)',
    enum: QRType,
    example: 'url',
  })
  @IsEnum(QRType)
  type: QRType;

  @ApiProperty({
    description: 'Whether the QR code is dynamic (allows changing the URL later)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isDynamic?: boolean;

  @ApiProperty({
    description: 'The data associated with the QR code (e.g., URL for Website type)',
    example: { url: 'https://example.com' },
  })
  @IsObject()
  data: any;

  @ApiProperty({
    description: 'Visual design settings (colors, dots, etc.)',
    example: { color: { dark: '#000000', light: '#ffffff' } },
  })
  @IsObject()
  design: any;

  @ApiProperty({
    description: 'Frame settings for the QR code',
    example: { text: 'Scan Me', style: 'standard' },
  })
  @IsObject()
  frame: any;

  @ApiProperty({
    description: 'Logo URL or identifier (optional)',
    example: 'logo-url-here',
    required: false,
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    description: 'QR code width',
    example: 300,
    required: false,
  })
  @IsInt()
  @IsOptional()
  width?: number;

  @ApiProperty({
    description: 'QR code height',
    example: 300,
    required: false,
  })
  @IsInt()
  @IsOptional()
  height?: number;

  @ApiProperty({
    description: 'Margin around the QR code',
    example: 10,
    required: false,
  })
  @IsInt()
  @IsOptional()
  margin?: number;
}
