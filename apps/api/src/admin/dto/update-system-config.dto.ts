import {
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSystemConfigDto {
  @ApiProperty({
    description: 'Main title of the landing page hero section',
    example: 'Turn Every Scan Into a Customer',
    required: false,
  })
  @IsString()
  @IsOptional()
  heroTitle?: string;

  @ApiProperty({
    description: 'Subtitle of the landing page hero section',
    example: 'Qrthrive helps you create powerful, branded QR codes.',
    required: false,
  })
  @IsString()
  @IsOptional()
  heroSubtitle?: string;

  @ApiProperty({
    description: 'Monthly subscription price in kobo (or the local currency unit)',
    example: 5000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  monthlyPrice?: number;

  @ApiProperty({
    description: 'Quarterly subscription price',
    example: 13500,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  quarterlyPrice?: number;

  @ApiProperty({
    description: 'Yearly subscription price',
    example: 50000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  yearlyPrice?: number;

  @ApiProperty({
    description: 'List of features displayed on the landing page',
    example: ['Custom Branding', 'Advanced Analytics', 'Unlimited Scans'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiProperty({
    description: 'Frequently Asked Questions list',
    example: [{ question: 'What is QR Thrive?', answer: 'A QR code management platform.' }],
    required: false,
  })
  @IsArray()
  @IsOptional()
  faqs?: { question: string; answer: string }[];

  @ApiProperty({
    description: 'Paystack plan code for monthly subscription',
    example: 'PLN_123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  monthlyPlanCode?: string;

  @ApiProperty({
    description: 'Paystack plan code for quarterly subscription',
    example: 'PLN_987654321',
    required: false,
  })
  @IsString()
  @IsOptional()
  quarterlyPlanCode?: string;

  @ApiProperty({
    description: 'Paystack plan code for yearly subscription',
    example: 'PLN_112233445',
    required: false,
  })
  @IsString()
  @IsOptional()
  yearlyPlanCode?: string;
}
