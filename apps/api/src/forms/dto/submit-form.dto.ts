import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitFormDto {
  @ApiProperty({
    description: 'A map of field IDs to their submitted values',
    example: { 'field-1': 'John Doe', 'field-2': 'john@example.com' },
  })
  @IsObject()
  answers: Record<string, any>; // fieldId to value
}
