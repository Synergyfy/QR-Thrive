import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { softDeleteExtension } from './soft-delete.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _extended: any;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Serverless optimized pool
    const pool = new Pool({ 
      connectionString,
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: connectionString.includes('supabase') || process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false
    });
    
    const adapter = new PrismaPg(pool as any);
    
    super({ 
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });

    // Initialize the extended client (from IssueFlow)
    this._extended = softDeleteExtension(this);

    // Return a proxy that directs model access to the extended client
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        // If the property exists on the extended client (like a model name), use it
        if (prop in target._extended) {
          return target._extended[prop];
        }
        // Otherwise use the base PrismaService
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database and initialized Soft-Delete Extension');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
