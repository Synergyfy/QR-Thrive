import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@Controller('folders')
@UseGuards(AuthGuard('jwt'))
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() createFolderDto: CreateFolderDto) {
    return this.foldersService.create(req.user.userId, createFolderDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.foldersService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.foldersService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(@Req() req: RequestWithUser, @Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
    return this.foldersService.update(id, req.user.userId, updateFolderDto);
  }

  @Delete(':id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.foldersService.remove(id, req.user.userId);
  }
}
