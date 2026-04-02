import { IsString } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  name: string;

  @IsString()
  color: string;
}

export class UpdateFolderDto {
  @IsString()
  name?: string;

  @IsString()
  color?: string;
}
