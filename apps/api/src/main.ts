import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Logger as PinoLogger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';

// Explicitly export the bootstrap function
export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useLogger(app.get(PinoLogger));

  app.use(helmet());
  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Increase body limit for file uploads (50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: ['http://localhost:5173', 'https://qrthrive.vercel.app', 'https://www.qrthrive.com', 'https://test.qrthrive.com'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('QR Thrive API')
    .setDescription('The QR Thrive API description and documentation for all endpoints.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching with @ApiBearerAuth()
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.init();
  return app.getHttpAdapter().getInstance();
}

// Local development server logic
if (!process.env.VERCEL) {
  bootstrap().then((expressInstance) => {
    const port = process.env.PORT ?? 3005;
    const logger = new Logger('Bootstrap');

    expressInstance.listen(port, () => {
      const baseUrl = `http://localhost:${port}`;
      logger.log(`Application is running on: ${baseUrl}`);
      logger.log(`Swagger documentation is available at: ${baseUrl}/api/docs`);
    });
  });
}
