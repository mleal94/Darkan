import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { Transport } from '@nestjs/microservices';
import { IoAdapter } from '@nestjs/platform-socket.io';

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
    credentials: true,
  });

  // Configurar Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Configurar gRPC microservice
  const grpcApp = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'or',
      protoPath: join(__dirname, '../proto/or.proto'),
      url: `0.0.0.0:${process.env.OR_SERVICE_GRPC_PORT || 5002}`,
    },
  });

  const httpPort = process.env.OR_SERVICE_PORT || 3002;
  
  await Promise.all([
    app.listen(httpPort),
    grpcApp.listen(),
  ]);

  console.log(`🚀 OR Service HTTP running on port ${httpPort}`);
  console.log(`🚀 OR Service gRPC running on port ${process.env.OR_SERVICE_GRPC_PORT || 5002}`);
  console.log(`🔌 WebSocket Server running on: ws://localhost:${httpPort}/reservations`);
  console.log(`🔌 WebSocket Namespace: /reservations`);
  console.log(`🔌 WebSocket CORS: ${process.env.CORS_ORIGIN || '*'}`);
}

bootstrap().catch((error) => {
  console.error('Error starting OR Service:', error);
  process.exit(1);
});
