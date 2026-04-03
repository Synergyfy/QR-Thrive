import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Logger as PinoLogger } from 'nestjs-pino';

// Explicitly export the bootstrap function
export async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'https://qrthrive.vercel.app',
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('QR Thrive API')
    .setDescription('The QR Thrive API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

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