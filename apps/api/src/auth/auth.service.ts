import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class AuthService {
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

    return this.generateAndSetTokens(user.id, res);
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAndSetTokens(user.id, res);
  }

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

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

    return this.generateAndSetTokens(tokenRecord.userId, res);
  }

  async logout(refreshToken: string, res: Response) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logged out' };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    return { user };
  }

  private async generateAndSetTokens(userId: string, res: Response) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
        expiresIn: '15m',
      },
    );

    const refreshTokenString = await bcrypt.hash(Math.random().toString(), 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

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
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refreshToken', refreshTokenString, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    return { user };
  }
}
