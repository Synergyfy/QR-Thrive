import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsObject,
} from 'class-validator';
import { FormFieldType } from '@prisma/client';

export class FormFieldDto {
  @IsEnum(FormFieldType)
  type: FormFieldType;

  @IsString()
  label: string;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsString()
  @IsOptional()
  helpText?: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsObject()
  @IsOptional()
  options?: any; // Array of { label: string, value: string }

  @IsObject()
  @IsOptional()
  validation?: any; // { min?: number, max?: number, pattern?: string }

  @IsInt()
  @IsOptional()
  order?: number;
}
