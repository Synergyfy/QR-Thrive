import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

// 1. Export the bootstrap function so Vercel can import it
export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('QR Thrive API')
    .setDescription('The QR Thrive API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 2. Initialize the app (do NOT call app.listen here)
  await app.init();

  // 3. Return the underlying Express instance
  return app.getHttpAdapter().getInstance();
}

// 4. Start the server normally ONLY if we are NOT on Vercel
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