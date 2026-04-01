import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createFolderDto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: {
        ...createFolderDto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { qrCodes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    return folder;
  }

  async update(id: string, userId: string, updateFolderDto: UpdateFolderDto) {
    const folder = await this.findOne(id, userId);

    return this.prisma.folder.update({
      where: { id: folder.id },
      data: updateFolderDto,
    });
  }

  async remove(id: string, userId: string) {
    const folder = await this.findOne(id, userId);

    return this.prisma.folder.delete({
      where: { id: folder.id },
    });
  }
}
