import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('Folders')
@ApiBearerAuth('JWT-auth')
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder for the user' })
  @ApiResponse({ status: 201, description: 'Folder created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  create(
    @Req() req: RequestWithUser,
    @Body() createFolderDto: CreateFolderDto,
  ) {
    return this.foldersService.create(req.user.userId, createFolderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all folders for the current user' })
  @ApiResponse({ status: 200, description: 'List of folders retrieved.' })
  findAll(@Req() req: RequestWithUser) {
    return this.foldersService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific folder by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the folder' })
  @ApiResponse({ status: 200, description: 'Folder details retrieved.' })
  @ApiResponse({ status: 404, description: 'Folder not found.' })
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.foldersService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a folder' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the folder' })
  @ApiResponse({ status: 200, description: 'Folder updated successfully.' })
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.foldersService.update(id, req.user.userId, updateFolderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a folder (soft delete)' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the folder' })
  @ApiResponse({ status: 200, description: 'Folder deleted successfully.' })
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.foldersService.remove(id, req.user.userId);
  }
}
