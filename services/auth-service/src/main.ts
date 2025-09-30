import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { Transport } from '@nestjs/microservices';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  
  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });

  // Configurar gRPC microservice
  const grpcApp = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, '../proto/auth.proto'),
      url: `0.0.0.0:${process.env.AUTH_SERVICE_GRPC_PORT || 5001}`,
    },
  });

  const httpPort = process.env.AUTH_SERVICE_PORT || 3001;
  
  await Promise.all([
    app.listen(httpPort),
    grpcApp.listen(),
  ]);

  console.log(`🚀 Auth Service HTTP running on port ${httpPort}`);
  console.log(`🚀 Auth Service gRPC running on port ${process.env.AUTH_SERVICE_GRPC_PORT || 5001}`);
}

bootstrap().catch((error) => {
  console.error('Error starting Auth Service:', error);
  process.exit(1);
});
