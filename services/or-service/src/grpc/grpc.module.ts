import { Module } from '@nestjs/common';
import { GrpcController } from './grpc.controller';
import { OperatingRoomsModule } from '../operating-rooms/operating-rooms.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [OperatingRoomsModule, ReservationsModule],
  controllers: [GrpcController],
})
export class GrpcModule {}
