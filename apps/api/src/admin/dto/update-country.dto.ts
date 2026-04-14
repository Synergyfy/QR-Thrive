import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PricingTier } from '@prisma/client';

export class UpdateCountryDto {
  @ApiProperty({ enum: PricingTier, required: false })
  @IsEnum(PricingTier)
  @IsOptional()
  tier?: PricingTier;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  currencySymbol?: string;
}
