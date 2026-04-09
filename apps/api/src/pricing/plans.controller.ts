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
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { PricingService } from './pricing.service';
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
  SetPlanPriceDto,
} from './pricing.dto';

@ApiTags('Plans')
@Controller('plans')
@UseGuards(RolesGuard)
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly pricingService: PricingService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Fetch all active plans with localized pricing' })
  @ApiResponse({ status: 200, description: 'List of plans retrieved.' })
  async getPublicPlans(@Ip() ip: string) {
    return this.pricingService.getLocalizedPlans(ip);
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

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Post(':id/price')
  @ApiOperation({ summary: 'Set or update a monthly price for a specific tier (Admin only)' })
  @ApiBody({ type: SetPlanPriceDto })
  async setPlanPrice(@Param('id') id: string, @Body() body: SetPlanPriceDto) {
    return this.plansService.setPrice(id, body);
  }
}
