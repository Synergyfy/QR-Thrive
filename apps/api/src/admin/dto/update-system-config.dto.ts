import { IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
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
    description: 'Percentage discount for quarterly plans',
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  quarterlyDiscount?: number;

  @ApiProperty({
    description: 'Percentage discount for yearly plans',
    example: 20,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  yearlyDiscount?: number;

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
    example: [
      {
        question: 'What is QR Thrive?',
        answer: 'A QR code management platform.',
      },
    ],
    required: false,
  })
  @IsArray()
  @IsOptional()
  faqs?: { question: string; answer: string }[];
}
