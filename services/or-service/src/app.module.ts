import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { OperatingRoomsModule } from './operating-rooms/operating-rooms.module';
import { ReservationsModule } from './reservations/reservations.module';
import { WebSocketsModule } from './websockets/websockets.module';
import { KafkaModule } from './kafka/kafka.module';
import { GrpcModule } from './grpc/grpc.module';
import { CommonModule } from './common/common.module';
import { OutboxModule } from './outbox/outbox.module';
import { StaffModule } from './staff/staff.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/or_scheduler'),
    OperatingRoomsModule,
    ReservationsModule,
    WebSocketsModule,
    KafkaModule,
    GrpcModule,
    CommonModule,
    OutboxModule,
    StaffModule,
  ],
})
export class AppModule {}
