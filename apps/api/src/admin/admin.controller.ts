import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { VemtapService } from '../integration/vemtap.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreatePriceBookDto } from './dto/create-price-book.dto';
import { UpdatePriceBookDto } from './dto/update-price-book.dto';
import { PricingTier } from '@prisma/client';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly vemtapService: VemtapService,
  ) {}

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('vemtap/plans')
  @ApiOperation({ summary: 'Get active plans from Vemtap (Admin only)' })
  async getVemtapPlans() {
    return this.vemtapService.fetchActivePlans();
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('stats')
  @ApiOperation({ summary: 'Get global system statistics (Admin only)' })
  @ApiQuery({ name: 'range', required: false, type: String, enum: ['7d', '30d', 'all'], example: '7d' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role.' })
  async getStats(@Query('range') range = '7d') {
    return this.adminService.getStats(range);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination and search (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or email' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by account status' })
  @ApiResponse({ status: 200, description: 'List of users retrieved.' })
  async getUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('search') search = '',
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(page, limit, search, status);
  }

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Get public system configuration (pricing, features, etc.)' })
  @ApiResponse({ status: 200, description: 'Config retrieved successfully.' })
  async getConfig() {
    return this.adminService.getConfig();
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch('config')
  @ApiOperation({ summary: 'Update system configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Config updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async updateConfig(@Body() body: UpdateSystemConfigDto) {
    return this.adminService.updateConfig(body);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Toggle user ban status (Admin only)' })
  async banUser(@Param('id') id: string) {
    return this.adminService.banUser(id);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('users/export')
  @ApiOperation({ summary: 'Export all users to CSV (Admin only)' })
  async exportUsers(@Res() res: Response) {
    const csv = await this.adminService.exportUsers();
    res.header('Content-Type', 'text/csv');
    res.attachment('users-export.csv');
    return res.send(csv);
  }

  // Country Management
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('countries')
  @ApiOperation({ summary: 'List all countries with optional tier filter (Admin only)' })
  async getCountries(@Query('tier') tier?: PricingTier) {
    return this.adminService.getCountries(tier);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch('countries/:code')
  @ApiOperation({ summary: 'Update a country tier or tax rate (Admin only)' })
  async updateCountry(
    @Param('code') code: string,
    @Body() body: UpdateCountryDto,
  ) {
    return this.adminService.updateCountry(code, body);
  }

  // PriceBook Management
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('plans/:planId/prices')
  @ApiOperation({ summary: 'Get all prices for a specific plan (Admin only)' })
  async getPlanPrices(@Param('planId') planId: string) {
    return this.adminService.getPlanPrices(planId);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Post('plans/:planId/prices')
  @ApiOperation({ summary: 'Create a new price entry for a plan (Admin only)' })
  async createPriceBook(
    @Param('planId') planId: string,
    @Body() body: CreatePriceBookDto,
  ) {
    return this.adminService.createPriceBook(planId, body);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch('price-books/:id')
  @ApiOperation({ summary: 'Update a price book entry status or value (Admin only)' })
  async updatePriceBook(
    @Param('id') id: string,
    @Body() body: UpdatePriceBookDto,
  ) {
    return this.adminService.updatePriceBook(id, body);
  }
}
