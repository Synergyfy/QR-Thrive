import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    description:
      'Password for the account (min 8 chars, uppercase, lowercase, number/special)',
    example: 'StrongPassword123!',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password is too weak. Must contain uppercase, lowercase and number/special character',
  })
  password: string;

  @ApiProperty({
    description: 'Password confirmation',
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Please confirm your password' })
  confirmPassword: string;
}

export class AdminSignupDto extends SignupDto {
  @ApiProperty({
    description: 'Admin secret code for creating admin accounts',
    example: 'super-secret-code',
  })
  @IsString()
  @IsNotEmpty({ message: 'Admin secret is required' })
  adminSecret: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Password for the account',
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    description: 'Whether to remember the user session',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}

export class GoogleLoginDto {
  @ApiProperty({
    description: 'The ID Token received from Google',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY0...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Google ID token is required' })
  token: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Avatar URL of the user',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string;
}
