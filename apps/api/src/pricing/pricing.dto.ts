import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { QRType } from '@prisma/client';

export class UpdatePricingDiscountsDto {
  @ApiProperty({ example: 10, description: 'Percentage discount for quarterly plans' })
  @IsNumber()
  @Min(0)
  @Max(100)
  quarterlyDiscount: number;

  @ApiProperty({ example: 20, description: 'Percentage discount for yearly plans' })
  @IsNumber()
  @Min(0)
  @Max(100)
  yearlyDiscount: number;
}

export class CreateTierDto {
  @ApiProperty({ example: 'Tier 1', description: 'Name of the economic tier' })
  @IsString()
  name: string;
}

export class UpdateTierDto extends CreateTierDto {}

export class CreateCountryDto {
  @ApiProperty({ example: 'US', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'United States', description: 'Full country name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'USD', description: 'Currency code' })
  @IsString()
  currencyCode: string;

  @ApiProperty({ example: '$', description: 'Currency symbol' })
  @IsString()
  currencySymbol: string;

  @ApiProperty({ example: 'tier_id_here', description: 'ID of the assigned tier' })
  @IsString()
  tierId: string;
}

export class UpdateCountryDto extends CreateCountryDto {}

export class CreatePlanDto {
  @ApiProperty({ example: 'Pro', description: 'Name of the plan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Perfect for small businesses', description: 'Plan description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 100, description: 'Maximum number of QR codes allowed' })
  @IsNumber()
  @Min(0)
  qrCodeLimit: number;

  @ApiProperty({ enum: QRType, isArray: true, example: [QRType.url, QRType.vcard] })
  @IsArray()
  @IsEnum(QRType, { each: true })
  qrCodeTypes: QRType[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdatePlanDto extends CreatePlanDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SetPlanPriceDto {
  @ApiProperty({ example: 'tier_id_here' })
  @IsString()
  tierId: string;

  @ApiProperty({ example: 20.0, description: 'Monthly price in USD' })
  @IsNumber()
  @Min(0)
  monthlyPriceUSD: number;
}
