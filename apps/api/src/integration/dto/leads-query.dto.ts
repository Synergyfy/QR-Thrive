import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LeadsQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Items per page' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for QR name or form title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by QR code types (comma-separated)',
    example: 'booking,menu',
    default: 'booking,menu',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((v) => v.trim());
    return value;
  })
  @IsArray()
  @IsEnum(['booking', 'menu', 'form'], { each: true })
  types?: string[] = ['booking', 'menu'];

  @ApiPropertyOptional({
    description: 'Filter by specific QR Code ID (UUID or shortId)',
  })
  @IsOptional()
  @IsString()
  qrCodeId?: string;
}
