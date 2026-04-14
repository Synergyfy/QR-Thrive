import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { PricingTier, BillingCycle, PriceStatus } from '@prisma/client';

export class CreatePriceBookDto {
  @ApiProperty({ enum: PricingTier })
  @IsEnum(PricingTier)
  tier: PricingTier;

  @ApiProperty()
  @IsString()
  currencyCode: string;

  @ApiProperty({ enum: BillingCycle })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

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
