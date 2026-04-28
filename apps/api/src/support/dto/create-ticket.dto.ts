import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ description: 'Guest name (if unauthenticated)', required: false })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiProperty({ description: 'Guest email (if unauthenticated)', required: false })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiProperty({ description: 'Initial message or subject', required: false })
  @IsOptional()
  @IsString()
  subject?: string;
}
