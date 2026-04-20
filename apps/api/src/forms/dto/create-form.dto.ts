import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FormFieldDto } from './form-field.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFormDto {
  @ApiProperty({
    description: 'Unique identifier of the QR code this form is linked to',
    example: 'uuid-qr-123',
  })
  @IsString()
  qrCodeId: string;

  @ApiProperty({
    description: 'Title of the form',
    example: 'Customer Feedback Form',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'A brief description of the form',
    example: 'Please let us know how we can improve our service.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'List of fields included in the form',
    type: [FormFieldDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];
}
