import { Module } from '@nestjs/common';
import { GrpcController } from './grpc.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [GrpcController],
})
export class GrpcModule {}
