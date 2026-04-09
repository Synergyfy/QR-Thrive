import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsObject,
} from 'class-validator';
import { FormFieldType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class FormFieldDto {
  @ApiProperty({
    description: 'Type of form field',
    enum: FormFieldType,
    example: FormFieldType.text,
  })
  @IsEnum(FormFieldType)
  type: FormFieldType;

  @ApiProperty({
    description: 'Label for the form field',
    example: 'Your Phone Number',
  })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Placeholder text for the field',
    example: 'e.g. +1 234 567 890',
    required: false,
  })
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiProperty({
    description: 'Help text displayed below the field',
    example: 'We will only use this to contact you about your order.',
    required: false,
  })
  @IsString()
  @IsOptional()
  helpText?: string;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiProperty({
    description: 'Options for select/radio fields',
    example: [{ label: 'Option 1', value: 'opt1' }],
    required: false,
  })
  @IsObject()
  @IsOptional()
  options?: any; // Array of { label: string, value: string }

  @ApiProperty({
    description: 'Custom validation rules',
    example: { min: 1, max: 100 },
    required: false,
  })
  @IsObject()
  @IsOptional()
  validation?: any; // { min?: number, max?: number, pattern?: string }

  @ApiProperty({
    description: 'Order of the field in the form',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  order?: number;
}
