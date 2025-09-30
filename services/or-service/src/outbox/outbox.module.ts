import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OutboxService } from './outbox.service';
import { OutboxEvent, OutboxEventSchema } from './schemas/outbox-event.schema';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OutboxEvent.name, schema: OutboxEventSchema }]),
    KafkaModule,
  ],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
