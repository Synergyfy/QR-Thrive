import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  UpdatePricingDiscountsDto,
  CreateTierDto,
  UpdateTierDto,
  CreateCountryDto,
  UpdateCountryDto,
} from './pricing.dto';

@ApiTags('Pricing & Geography')
@Controller('pricing')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get pricing discounts (quarterly, yearly) (Admin only)' })
  async getPricingConfig() {
    return this.pricingService.getPricingConfig();
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update pricing discounts (percentage) (Admin only)' })
  @ApiBody({ type: UpdatePricingDiscountsDto })
  async updatePricingConfig(@Body() body: UpdatePricingDiscountsDto) {
    return this.pricingService.updatePricingConfig(
      body.quarterlyDiscount,
      body.yearlyDiscount,
    );
  }

  @Get('tiers')
  @ApiOperation({ summary: 'List all economic tiers (Admin only)' })
  async getTiers() {
    return this.pricingService.getAllTiers();
  }

  @Post('tiers')
  @ApiOperation({ summary: 'Create a new tier (Admin only)' })
  @ApiBody({ type: CreateTierDto })
  async createTier(@Body() body: CreateTierDto) {
    return this.pricingService.createTier(body.name);
  }

  @Patch('tiers/:id')
  @ApiOperation({ summary: 'Update a tier name (Admin only)' })
  @ApiBody({ type: UpdateTierDto })
  async updateTier(@Param('id') id: string, @Body() body: UpdateTierDto) {
    return this.pricingService.updateTier(id, body.name);
  }

  @Delete('tiers/:id')
  @ApiOperation({ summary: 'Delete a tier (Admin only)' })
  async deleteTier(@Param('id') id: string) {
    return this.pricingService.deleteTier(id);
  }

  @Get('countries')
  @ApiOperation({ summary: 'List all countries and their tier assignments (Admin only)' })
  async getCountries() {
    return this.pricingService.getAllCountries();
  }

  @Post('countries')
  @ApiOperation({ summary: 'Add or update a country assignment (Admin only)' })
  @ApiBody({ type: CreateCountryDto })
  async upsertCountry(@Body() body: CreateCountryDto) {
    return this.pricingService.upsertCountry(body);
  }

  @Delete('countries/:code')
  @ApiOperation({ summary: 'Remove a country from the system (Admin only)' })
  async deleteCountry(@Param('code') code: string) {
    return this.pricingService.deleteCountry(code);
  }
}
