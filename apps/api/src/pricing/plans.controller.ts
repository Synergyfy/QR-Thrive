import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Ip,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PlansService } from './plans.service';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  CreatePlanDto,
  UpdatePlanDto,
} from './pricing.dto';

@ApiTags('Plans')
@Controller('plans')
@UseGuards(RolesGuard)
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly pricingService: PricingService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Fetch all active plans with localized pricing' })
  @ApiResponse({ status: 200, description: 'List of plans retrieved.' })
  async getPublicPlans(@Req() req: Request, @Ip() ip: string) {
    let countryCode = (req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country']) as string;
    
    // Account Locking: If user is logged in, use their locked country code
    const accessToken = (req as any).cookies?.['accessToken'];
    if (accessToken) {
      try {
        const payload = await this.jwtService.verifyAsync(accessToken, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
        });
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (user?.countryCode) {
          countryCode = user.countryCode;
        }
      } catch (e) {
        // Token invalid, fallback to IP detection
      }
    }

    if (!countryCode) {
      countryCode = this.pricingService.getCountryCodeByIp(ip);
    }

    return this.pricingService.getLocalizedPlans(countryCode as string);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('all')
  @ApiOperation({ summary: 'Fetch all plans with raw tier prices (Admin only)' })
  async getAllPlans() {
    return this.plansService.findAll();
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({ summary: 'Create a new plan (Admin only)' })
  @ApiBody({ type: CreatePlanDto })
  async createPlan(@Body() body: CreatePlanDto) {
    return this.plansService.create(body);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing plan (Admin only)' })
  @ApiBody({ type: UpdatePlanDto })
  async updatePlan(@Param('id') id: string, @Body() body: UpdatePlanDto) {
    return this.plansService.update(id, body);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan (Admin only)' })
  async deletePlan(@Param('id') id: string) {
    return this.plansService.delete(id);
  }
}
