import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { PriceStatus } from '@prisma/client';

export class UpdatePriceBookDto {
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
  @IsDateString()
  @IsOptional()
  activeFrom?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  activeTo?: string;
}
