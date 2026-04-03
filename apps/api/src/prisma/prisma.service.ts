import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super();
    this.logger.log('PrismaService initialized');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error.message);
      // Don't throw the full error to avoid exposing the URL in logs,
      // but the 'at base' message should now be clearer if it persists.
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
