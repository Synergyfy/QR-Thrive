import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'The text content of the message' })
  @IsNotEmpty()
  @IsString()
  text: string;
}
