import { IsEnum, IsBoolean, IsOptional, IsObject, IsInt, IsString } from 'class-validator';
import { QRType } from '@prisma/client';

export class CreateQRCodeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  folderId?: string;

  @IsEnum(QRType)
  type: QRType;

  @IsBoolean()
  @IsOptional()
  isDynamic?: boolean;

  @IsObject()
  data: any;

  @IsObject()
  design: any;

  @IsObject()
  frame: any;

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
