import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(Role.ADMIN)
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Roles(Role.ADMIN)
  @Get('users')
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
  async getConfig() {
    return this.adminService.getConfig();
  }

  @Roles(Role.ADMIN)
  @Patch('config')
  async updateConfig(@Body() body: UpdateSystemConfigDto) {
    return this.adminService.updateConfig(body);
  }
}
