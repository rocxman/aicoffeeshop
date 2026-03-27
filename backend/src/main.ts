import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Port
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🚀 AI Coffee Shop Platform is running!          ║
  ║                                                   ║
  ║   Server: http://localhost:${port}                 ║
  ║   API:    http://localhost:${port}/api             ║
  ║                                                   ║
  ║   Endpoints:                                      ║
  ║   - Auth:     /api/auth/*                         ║
  ║   - Menu:     /api/menu/*                         ║
  ║   - Orders:   /api/orders/*                       ║
  ║   - AI Chat:  /api/ai/chat                        ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
}

bootstrap();
