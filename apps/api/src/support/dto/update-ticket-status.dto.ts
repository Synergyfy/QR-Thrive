import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, description: 'The new status of the ticket' })
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
