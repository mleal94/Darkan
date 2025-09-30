import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffGrpcController } from './staff-grpc.controller';
import { CommonModule } from '../common/common.module';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
    ]),
  ],
  controllers: [StaffGrpcController],
  providers: [],
  exports: [],
})
export class StaffModule {}
