import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { OutboxEvent, OutboxEventDocument, OutboxEventStatus } from './schemas/outbox-event.schema';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class OutboxService {
  constructor(
    @InjectModel(OutboxEvent.name) private outboxEventModel: Model<OutboxEventDocument>,
    private kafkaService: KafkaService,
  ) {}

  async createOutboxEvent(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    payload: any,
    session?: ClientSession,
  ): Promise<OutboxEventDocument> {
    const outboxEvent = new this.outboxEventModel({
      eventType,
      eventId: uuidv4(),
      aggregateId,
      aggregateType,
      payload,
      status: OutboxEventStatus.PENDING,
      retryCount: 0,
      nextRetryAt: new Date(),
    });

    return outboxEvent.save({ session });
  }

  async processOutboxEvents(): Promise<void> {
    const events = await this.outboxEventModel.find({
      status: OutboxEventStatus.PENDING,
      nextRetryAt: { $lte: new Date() },
    }).limit(100).exec();

    for (const event of events) {
      await this.processEvent(event);
    }
  }

  private async processEvent(event: OutboxEventDocument): Promise<void> {
    try {
      // Marcar como procesando
      event.status = OutboxEventStatus.PROCESSING;
      await event.save();

      // Publicar evento en Kafka
      await this.publishEvent(event);

      // Marcar como completado
      event.status = OutboxEventStatus.COMPLETED;
      event.processedAt = new Date();
      await event.save();

      console.log(`Outbox event processed: ${event.eventId}`);
    } catch (error) {
      console.error(`Error processing outbox event ${event.eventId}:`, error);
      
      // Incrementar contador de reintentos
      event.retryCount += 1;
      event.errorMessage = error.message;

      if (event.retryCount >= 3) {
        // Marcar como fallido después de 3 intentos
        event.status = OutboxEventStatus.FAILED;
      } else {
        // Programar siguiente reintento (backoff exponencial)
        const delay = Math.pow(2, event.retryCount) * 1000; // 1s, 2s, 4s
        event.nextRetryAt = new Date(Date.now() + delay);
        event.status = OutboxEventStatus.PENDING;
      }

      await event.save();
    }
  }

  private async publishEvent(event: OutboxEventDocument): Promise<void> {
    const kafkaEvent = {
      eventType: event.eventType,
      eventId: event.eventId,
      timestamp: event.createdAt,
      data: event.payload,
      version: '1.0',
    };

    switch (event.eventType) {
      case 'reservation.created':
        await this.kafkaService.publishReservationCreated(event.payload);
        break;
      case 'reservation.updated':
        await this.kafkaService.publishReservationUpdated(event.payload);
        break;
      case 'reservation.cancelled':
        await this.kafkaService.publishReservationCancelled(event.payload);
        break;
      default:
        console.warn(`Unknown event type: ${event.eventType}`);
    }
  }

  async getFailedEvents(): Promise<OutboxEventDocument[]> {
    return this.outboxEventModel.find({
      status: OutboxEventStatus.FAILED,
    }).exec();
  }

  async retryFailedEvent(eventId: string): Promise<void> {
    const event = await this.outboxEventModel.findById(eventId).exec();
    if (event && event.status === OutboxEventStatus.FAILED) {
      event.status = OutboxEventStatus.PENDING;
      event.retryCount = 0;
      event.nextRetryAt = new Date();
      event.errorMessage = undefined;
      await event.save();
    }
  }
}
