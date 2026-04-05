import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
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

@Module({
  imports: [
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
    PrismaModule,
    AuthModule,
    QRCodesModule,
    FoldersModule,
    FormsModule,
    UploadModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }


