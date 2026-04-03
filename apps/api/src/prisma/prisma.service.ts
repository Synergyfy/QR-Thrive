import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // We call super() without arguments. 
    // Prisma 7 will automatically use the DATABASE_URL from process.env 
    // and the configuration in your prisma.config.ts.
    super();
    this.logger.log('PrismaService initialized (Standard Engine)');
  }

  async onModuleInit() {
    try {
      this.logger.log('Attempting to connect to database...');
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database');
      this.logger.error(`Error Code: ${error.code || 'N/A'}`);
      this.logger.error(`Error Message: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
