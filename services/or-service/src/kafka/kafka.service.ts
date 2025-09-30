import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { ReservationCreatedEvent, ReservationUpdatedEvent, ReservationCancelledEvent } from '../common/types/kafka.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'or-service',
      brokers: ['172.18.130.69:9092'],
      connectionTimeout: 3000,
      requestTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'or-service-group' });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
    
    // Suscribirse a los topics necesarios
    await this.consumer.subscribe({ 
      topics: ['file.attached', 'user.updated'],
      fromBeginning: false 
    });

    // Procesar mensajes
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          await this.handleEvent(topic, event);
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      },
    });

    console.log('Kafka service initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async publishReservationCreated(data: any): Promise<void> {
    const event: ReservationCreatedEvent = {
      eventType: 'reservation.created',
      eventId: uuidv4(),
      timestamp: new Date(),
      data,
      version: '1.0',
    };

    await this.producer.send({
      topic: 'reservation.created',
      messages: [{
        key: data.reservationId,
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
      }],
    });

    console.log('Published reservation.created event:', event.eventId);
  }

  async publishReservationUpdated(data: any): Promise<void> {
    const event: ReservationUpdatedEvent = {
      eventType: 'reservation.updated',
      eventId: uuidv4(),
      timestamp: new Date(),
      data,
      version: '1.0',
    };

    await this.producer.send({
      topic: 'reservation.updated',
      messages: [{
        key: data.reservationId,
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
      }],
    });

    console.log('Published reservation.updated event:', event.eventId);
  }

  async publishReservationCancelled(data: any): Promise<void> {
    const event: ReservationCancelledEvent = {
      eventType: 'reservation.cancelled',
      eventId: uuidv4(),
      timestamp: new Date(),
      data,
      version: '1.0',
    };

    await this.producer.send({
      topic: 'reservation.cancelled',
      messages: [{
        key: data.reservationId,
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
      }],
    });

    console.log('Published reservation.cancelled event:', event.eventId);
  }

  private async handleEvent(topic: string, event: any): Promise<void> {
    switch (topic) {
      case 'file.attached':
        await this.handleFileAttached(event);
        break;
      case 'user.updated':
        await this.handleUserUpdated(event);
        break;
      default:
        console.log(`Unhandled event topic: ${topic}`);
    }
  }

  private async handleFileAttached(event: any): Promise<void> {
    console.log('File attached to reservation:', event.data.reservationId);
    // Aquí se podría actualizar la reserva con información del archivo adjunto
  }

  private async handleUserUpdated(event: any): Promise<void> {
    console.log('User updated:', event.data.userId);
    // Aquí se podría actualizar información del usuario en las reservas
  }
}
