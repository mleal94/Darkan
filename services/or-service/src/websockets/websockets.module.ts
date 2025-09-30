import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReservationsGateway } from './websockets.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),
  ],
  providers: [ReservationsGateway],
  exports: [ReservationsGateway],
})
export class WebSocketsModule {}
