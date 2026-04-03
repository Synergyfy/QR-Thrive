import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: any;

  constructor(configService: ConfigService) {
    // 1. Get configuration BEFORE super()
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // 2. Setup the Connection Pool (Serverless Optimized)
    const pool = new Pool({
      connectionString,
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl:
        connectionString.includes('supabase') ||
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    });

    // 3. Initialize the Adapter
    const adapter = new PrismaPg(pool);

    // 4. Call super() with the adapter to satisfy Prisma 7 requirements
    super({ adapter });

    // 5. Apply any extensions here (like Soft-Delete from IssueFlow)
    // For now, we point 'this.prisma' to 'this' (the configured client)
    // If you add extensions later: this.prisma = this.$extends(...)
    this.prisma = this;

    // 6. Return the IssueFlow Proxy
    return new Proxy(this, {
      get: (target, prop) => {
        // If the property exists on this Service class, use it
        if (prop in target) {
          return (target as any)[prop];
        }
        // Otherwise, redirect to the Prisma Client
        return (target.prisma as any)[prop];
      },
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to database via IssueFlow Proxy Pattern...');
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
