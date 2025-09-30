import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthGrpcService } from './services/auth-grpc.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(__dirname, '../../proto/auth.proto'),
          url: process.env.AUTH_SERVICE_GRPC_URL || 'localhost:5001',
        },
      },
    ]),
  ],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, AuthGrpcService],
  exports: [JwtStrategy, JwtAuthGuard, RolesGuard, AuthGrpcService],
})
export class CommonModule {}
