import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsInt,
  IsString,
} from 'class-validator';
import { QRType, QRStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateQRCodeDto {
  @ApiProperty({
    description: 'Updated name of the QR code',
    example: 'Summer Campaign Updated',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Updated description',
    example: 'New description for the summer campaign',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Updated folder ID',
    example: 'uuid-folder-456',
    required: false,
  })
  @IsString()
  @IsOptional()
  folderId?: string;

  @ApiProperty({
    description: 'Updated status of the QR code',
    enum: QRStatus,
    example: QRStatus.active,
    required: false,
  })
  @IsEnum(QRStatus)
  @IsOptional()
  status?: QRStatus;

  @ApiProperty({
    description: 'Updated type of the QR code',
    enum: QRType,
    example: 'url',
    required: false,
  })
  @IsEnum(QRType)
  @IsOptional()
  type?: QRType;

  @ApiProperty({
    description: 'Updated dynamic setting',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isDynamic?: boolean;

  @ApiProperty({
    description: 'Updated data associated with the QR code',
    example: { url: 'https://new-url.com' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  data?: any;

  @ApiProperty({
    description: 'Updated visual design settings',
    example: { color: { dark: '#ff0000', light: '#ffffff' } },
    required: false,
  })
  @IsObject()
  @IsOptional()
  design?: any;

  @ApiProperty({
    description: 'Updated frame settings',
    example: { text: 'Scan Now', style: 'compact' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  frame?: any;

  @ApiProperty({
    description: 'Updated logo URL or identifier',
    example: 'new-logo-url',
    required: false,
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    description: 'Updated QR code width',
    example: 600,
    required: false,
  })
  @IsInt()
  @IsOptional()
  width?: number;

  @ApiProperty({
    description: 'Updated QR code height',
    example: 600,
    required: false,
  })
  @IsInt()
  @IsOptional()
  height?: number;

  @ApiProperty({
    description: 'Updated margin around the QR code',
    example: 5,
    required: false,
  })
  @IsInt()
  @IsOptional()
  margin?: number;

  @ApiProperty({
    description: 'ID of an existing QR code to link to',
    example: 'uuid-qr-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  linkedQRCodeId?: string;
}
