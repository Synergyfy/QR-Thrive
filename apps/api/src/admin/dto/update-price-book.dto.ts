import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { PriceStatus, PricingTier, BillingCycle } from '@prisma/client';

export class UpdatePriceBookDto {
  @ApiProperty({ enum: PricingTier, required: false })
  @IsEnum(PricingTier)
  @IsOptional()
  tier?: PricingTier;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiProperty({ enum: BillingCycle, required: false })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ enum: PriceStatus, required: false })
  @IsEnum(PriceStatus)
  @IsOptional()
  status?: PriceStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  stripePriceId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  paystackPlanCode?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  activeFrom?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  activeTo?: string;
}
