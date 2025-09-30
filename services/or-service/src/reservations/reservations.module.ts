import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { Idempotency, IdempotencySchema } from './schemas/idempotency.schema';
import { OperatingRoomsModule } from '../operating-rooms/operating-rooms.module';
import { KafkaModule } from '../kafka/kafka.module';
import { CommonModule } from '../common/common.module';
import { OutboxModule } from '../outbox/outbox.module';
import { ExpirationScheduler } from './schedulers/expiration.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Idempotency.name, schema: IdempotencySchema },
    ]),
    OperatingRoomsModule,
    KafkaModule,
    CommonModule,
    OutboxModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ExpirationScheduler],
  exports: [ReservationsService],
})
export class ReservationsModule {}
