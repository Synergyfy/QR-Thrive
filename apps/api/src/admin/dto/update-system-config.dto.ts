import { IsNumber, IsString, IsArray, IsOptional, IsObject } from 'class-validator';

export class UpdateSystemConfigDto {
  @IsString()
  @IsOptional()
  heroTitle?: string;

  @IsString()
  @IsOptional()
  heroSubtitle?: string;

  @IsNumber()
  @IsOptional()
  monthlyPrice?: number;

  @IsNumber()
  @IsOptional()
  quarterlyPrice?: number;

  @IsNumber()
  @IsOptional()
  yearlyPrice?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsArray()
  @IsOptional()
  faqs?: { question: string; answer: string }[];

  @IsString()
  @IsOptional()
  monthlyPlanCode?: string;

  @IsString()
  @IsOptional()
  quarterlyPlanCode?: string;

  @IsString()
  @IsOptional()
  yearlyPlanCode?: string;
}
