import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private static instance: PrismaService;

  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const pool = new Pool({ 
      connectionString,
      max: 1, // Crucial for serverless: limit each instance to 1 connection
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: connectionString.includes('supabase') || process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false
    });
    
    const adapter = new PrismaPg(pool);
    
    super({ adapter });
    
    this.logger.log('PrismaService initialized with PrismaPg adapter (Serverless Optimized)');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
