import { Module } from '@nestjs/common';
import { ReservationsGateway } from './websockets.gateway';

@Module({
  providers: [ReservationsGateway],
  exports: [ReservationsGateway],
})
export class WebSocketsModule {}
