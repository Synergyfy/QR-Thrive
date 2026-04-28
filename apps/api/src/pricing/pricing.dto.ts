import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { QRType, PricingTier } from '@prisma/client';

export class UpdatePricingDiscountsDto {
  @ApiProperty({
    example: 10,
    description: 'Percentage discount for quarterly plans',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  quarterlyDiscount: number;

  @ApiProperty({
    example: 20,
    description: 'Percentage discount for yearly plans',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  yearlyDiscount: number;
}

export class CreateCountryDto {
  @ApiProperty({
    example: 'US',
    description: 'ISO 3166-1 alpha-2 country code',
  })
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

  @ApiProperty({
    enum: PricingTier,
    example: PricingTier.HIGH,
    description: 'The assigned economic tier',
  })
  @IsEnum(PricingTier)
  tier: PricingTier;
}

export class UpdateCountryDto extends CreateCountryDto {}

export class CreatePlanDto {
  @ApiProperty({ example: 'Pro', description: 'Name of the plan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Perfect for small businesses',
    description: 'Plan description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 100,
    description: 'Maximum number of QR codes allowed',
  })
  @IsNumber()
  @Min(0)
  qrCodeLimit: number;

  @ApiProperty({
    enum: QRType,
    isArray: true,
    example: [QRType.url, QRType.vcard],
  })
  @IsArray()
  @IsEnum(QRType, { each: true })
  qrCodeTypes: QRType[];

  @ApiPropertyOptional({
    example: ['Feature 1', 'Feature 2'],
    description: 'List of plan features',
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({ example: 7, description: 'Number of trial days' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  trialDays?: number;

  @ApiPropertyOptional({
    example: 'vemtap_plan_uuid',
    description: 'Attached Vemtap Plan ID',
  })
  @IsString()
  @IsOptional()
  vemtapPlanId?: string;

  @ApiPropertyOptional({ example: 20.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  highTierPrice?: number;

  @ApiPropertyOptional({ example: 10.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  middleTierPrice?: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowTierPrice?: number;
}

export class UpdatePlanDto extends CreatePlanDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
