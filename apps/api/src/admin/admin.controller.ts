import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
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
  constructor(private readonly adminService: AdminService) {}

  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('stats')
  @ApiOperation({ summary: 'Get global system statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role.' })
  async getStats() {
    return this.adminService.getStats();
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
}
