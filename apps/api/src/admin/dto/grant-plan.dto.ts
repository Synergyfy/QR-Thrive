import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export enum GiftPlanDuration {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class GrantPlanDto {
  @ApiProperty({
    description: 'The ID of the plan to grant',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({
    description: 'The duration of the free plan',
    enum: GiftPlanDuration,
    example: 'month',
  })
  @IsEnum(GiftPlanDuration)
  @IsNotEmpty()
  duration: GiftPlanDuration;
}
