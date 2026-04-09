import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({
    description: 'Name of the folder',
    example: 'Summer Campaign',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Color of the folder (hex code)',
    example: '#3b82f6',
  })
  @IsString()
  color: string;
}

export class UpdateFolderDto {
  @ApiProperty({
    description: 'Updated name of the folder',
    example: 'Winter Campaign',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Updated color of the folder (hex code)',
    example: '#ef4444',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;
}
