import { Injectable, UnauthorizedException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto, res: Response) {
    const { email, password, confirmPassword, firstName, lastName } = signupDto;

    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    try {
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
      });

      this.logger.log(`User created: ${email}`);
      return this.generateAndSetTokens(user.id, res, true);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`Signup error for ${email}:`, error.stack);
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password, rememberMe } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${email}`);
    return this.generateAndSetTokens(user.id, res, rememberMe);
  }

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        if (tokenRecord) {
          await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
        }
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Delete the old refresh token (rotation)
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

      this.logger.log(`Token refreshed for user: ${tokenRecord.user.email}`);
      // Maintain session length during refresh
      return this.generateAndSetTokens(tokenRecord.userId, res, true);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Refresh error:`, error.stack);
      throw new InternalServerErrorException('Error refreshing token');
    }
  }

  async logout(refreshToken: string, res: Response) {
    if (refreshToken) {
      try {
        await this.prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      } catch (error) {
        this.logger.error(`Logout token deletion error:`, error.stack);
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logged out' };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, plan: true },
    });
    return { user };
  }

  private async generateAndSetTokens(userId: string, res: Response, rememberMe: boolean = false) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, plan: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, role: user.role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
        expiresIn: '15m',
      },
    );

    const refreshTokenString = await bcrypt.hash(Math.random().toString(), 10);
    
    // Set refresh token expiration based on rememberMe
    const refreshDays = rememberMe ? 30 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId,
        expiresAt,
      },
    });

    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refreshToken', refreshTokenString, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: refreshDays * 24 * 60 * 60 * 1000,
    });

    return { user };
  }
}
