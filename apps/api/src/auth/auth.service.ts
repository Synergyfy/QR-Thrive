import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto, AdminSignupDto, GoogleLoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';
import { VemtapService } from '../integration/vemtap.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private vemtapService: VemtapService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  private async getDefaultPlanData() {
    let defaultPlan = await this.prisma.plan.findFirst({
      where: { isDefault: true, isActive: true, deletedAt: null },
    });

    // Fallback if no explicit default plan exists
    if (!defaultPlan) {
      defaultPlan = await this.prisma.plan.findFirst({
        where: { name: 'Free', isActive: true, deletedAt: null },
      });
    }

    // Ultimate fallback to first available plan
    if (!defaultPlan) {
      defaultPlan = await this.prisma.plan.findFirst({
        where: { isActive: true, deletedAt: null },
      });
    }

    if (!defaultPlan) {
      this.logger.error('CRITICAL: No plans found in database during signup provisioning.');
      return {};
    }

    const planData: any = { planId: defaultPlan.id };

    if (defaultPlan.isFree) {
      planData.subscriptionStatus = 'active';
    } else if (defaultPlan.trialDays > 0) {
      const now = new Date();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(now.getDate() + defaultPlan.trialDays);

      planData.trialStartedAt = now;
      planData.trialEndsAt = trialEndsAt;
      planData.subscriptionStatus = 'trialing';
    }

    return planData;
  }

  async signup(signupDto: SignupDto, res: Response, countryCode?: string) {
    const { email, password, confirmPassword, firstName, lastName } = signupDto;

    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const defaultPlanData = await this.getDefaultPlanData();
      
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'USER',
          countryCode,
          ...defaultPlanData,
        },
      });

      this.logger.log(`User created: ${email} with role: USER`);

      // Provision on Vemtap if a vemtapPlanId exists for the default plan
      if (defaultPlanData.planId) {
        const plan = await this.prisma.plan.findUnique({ where: { id: defaultPlanData.planId } });
        if (plan?.vemtapPlanId) {
          this.vemtapService.provisionUser(email, firstName, lastName, plan.vemtapPlanId).catch(err => {
            this.logger.error(`Vemtap provisioning failed for ${email} during signup:`, err);
          });
        }
      }

      return this.generateAndSetTokens(user.id, res, true);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`Signup error for ${email}:`, error.stack);
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async signupAdmin(adminSignupDto: AdminSignupDto, res: Response) {
    const { email, password, confirmPassword, firstName, lastName, adminSecret } = adminSignupDto;

    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    const secret = this.configService.get<string>('ADMIN_CREATION_SECRET');
    if (!secret || adminSecret !== secret) {
      throw new UnauthorizedException('Invalid admin creation secret');
    }

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
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
          role: 'ADMIN',
        },
      });

      this.logger.log(`Admin user created: ${email}`);
      return this.generateAndSetTokens(user.id, res, true);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`Admin signup error for ${email}:`, error.stack);
      throw new InternalServerErrorException('Error creating admin user');
    }
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password, rememberMe } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      this.logger.warn(`Login attempt for passwordless user (Google sign-in only): ${email}`);
      throw new UnauthorizedException('Please log in with Google');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${email}`);
    return this.generateAndSetTokens(user.id, res, rememberMe);
  }

  async googleLogin(googleLoginDto: GoogleLoginDto, res: Response, countryCode?: string) {
    const { token } = googleLoginDto;

    this.logger.log('Attempting Google login...');
    if (!token) {
      this.logger.error('No token provided in GoogleLoginDto');
      throw new UnauthorizedException('No token provided');
    }

    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      this.logger.log(`Using Client ID: ${clientId}`);

      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const {
        email,
        sub: googleId,
        given_name: firstName,
        family_name: lastName,
        picture: avatar,
      } = payload;

      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Block Admins from logging in with Google
        if (user.role === 'ADMIN') {
          this.logger.warn(`Admin login attempt via Google: ${email}`);
          throw new UnauthorizedException('Admins cannot login with Google');
        }

        // Link Google ID if not already linked
        if (!user.googleId) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { googleId, avatar },
          });
        }
      } else {
        // Create new user
        const defaultPlanData = await this.getDefaultPlanData();
        
        user = await this.prisma.user.create({
          data: {
            email,
            googleId,
            firstName: firstName || 'User',
            lastName: lastName || '',
            avatar,
            role: 'USER',
            countryCode,
            ...defaultPlanData,
          },
        });
        this.logger.log(`New user created via Google: ${email}`);

        // Provision on Vemtap for new Google users
        if (defaultPlanData.planId) {
            const plan = await this.prisma.plan.findUnique({ where: { id: defaultPlanData.planId } });
            if (plan?.vemtapPlanId) {
              this.vemtapService.provisionUser(email, firstName || 'User', lastName || '', plan.vemtapPlanId).catch(err => {
                this.logger.error(`Vemtap provisioning failed for ${email} during Google signup:`, err);
              });
            }
        }
      }

      return this.generateAndSetTokens(user.id, res, true);
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Google login error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Failed to authenticate with Google');
    }
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
          await this.prisma.refreshToken.delete({
            where: { id: tokenRecord.id },
          });
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
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        plan: true,
        planId: true,
        subscriptionStatus: true,
        billingCycle: true,
        trialStartedAt: true,
        trialEndsAt: true,
        hasUsedTrial: true,
      },
    });
    this.logger.log(`Fetching user profile: ${user?.email} - Status: ${user?.subscriptionStatus} - Role: ${user?.role}`);
    return { user };
  }

  async generateMagicLink(userId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    await this.prisma.magicLink.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    const baseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
    return `${baseUrl}/v1/auth/magic-login?token=${token}`;
  }

  async validateMagicLink(token: string, res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    try {
      // Find and update in one go to ensure atomicity
      const magicLink = await this.prisma.magicLink.update({
        where: { 
          token,
          used: false,
          expiresAt: { gt: new Date() }
        },
        data: { used: true },
        include: { user: true }
      });

      // Generate tokens and set cookies
      await this.generateAndSetTokens(magicLink.userId, res, true);

      // Redirect to dashboard with hint for frontend
      return res.redirect(`${frontendUrl}/dashboard?auth_success=true`);
    } catch (error) {
      this.logger.warn(`Failed magic link login attempt with token: ${token}`);
      return res.redirect(`${frontendUrl}/login?error=invalid_link`);
    }
  }

  private async generateAndSetTokens(
    userId: string,
    res: Response,
    rememberMe: boolean = false,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        plan: true,
        planId: true,
        subscriptionStatus: true,
        billingCycle: true,
        trialStartedAt: true,
        trialEndsAt: true,
        hasUsedTrial: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, role: user.role },
      {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ||
          'access_secret',
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
    this.logger.log(`Setting tokens for user ${userId}. isProd=${isProd}, sameSite=${isProd ? 'none' : 'lax'}, secure=${isProd}`);

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
