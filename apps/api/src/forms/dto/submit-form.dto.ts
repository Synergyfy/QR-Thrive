import { IsObject } from 'class-validator';

export class SubmitFormDto {
  @IsObject()
  answers: Record<string, any>; // fieldId to value
}
