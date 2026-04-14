import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { QRCodesModule } from './qr-codes/qr-codes.module';
import { FoldersModule } from './folders/folders.module';
import { FormsModule } from './forms/forms.module';
import { UploadModule } from './upload/upload.module';
import { MediaModule } from './media/media.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { PricingModule } from './pricing/pricing.module';
import { IntegrationModule } from './integration/integration.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 3600, // 1 hour default
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        // transport: process.env.NODE_ENV !== 'production'
        //   ? { target: 'pino-pretty', options: { colorize: true } }
        //   : undefined,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    QRCodesModule,
    FoldersModule,
    FormsModule,
    UploadModule,
    MediaModule,
    PaymentsModule,
    AdminModule,
    PricingModule,
    IntegrationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
