import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsObject,
  IsInt,
  IsString,
} from 'class-validator';
import { QRType, QRStatus } from '@prisma/client';

export class UpdateQRCodeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  folderId?: string;

  @IsEnum(QRStatus)
  @IsOptional()
  status?: QRStatus;

  @IsEnum(QRType)
  @IsOptional()
  type?: QRType;

  @IsBoolean()
  @IsOptional()
  isDynamic?: boolean;

  @IsObject()
  @IsOptional()
  data?: any;

  @IsObject()
  @IsOptional()
  design?: any;

  @IsObject()
  @IsOptional()
  frame?: any;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsInt()
  @IsOptional()
  width?: number;

  @IsInt()
  @IsOptional()
  height?: number;

  @IsInt()
  @IsOptional()
  margin?: number;
}
