import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

interface FileAttachedEvent {
  eventType: 'file.attached';
  eventId: string;
  timestamp: Date;
  data: {
    fileId: string;
    reservationId: string;
    uploaderId: string;
    type: string;
    s3Key: string;
    metadata: any;
  };
  version: string;
}

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'file-service',
      brokers: ['172.18.130.69:9092'],
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'file-service-group' });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
    
    // Suscribirse a los topics necesarios
    await this.consumer.subscribe({ 
      topics: ['reservation.created', 'reservation.updated', 'reservation.cancelled'],
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

  async publishFileAttached(data: any): Promise<void> {
    const event: FileAttachedEvent = {
      eventType: 'file.attached',
      eventId: uuidv4(),
      timestamp: new Date(),
      data,
      version: '1.0',
    };

    await this.producer.send({
      topic: 'file.attached',
      messages: [{
        key: data.fileId,
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
      }],
    });

    console.log('Published file.attached event:', event.eventId);
  }

  private async handleEvent(topic: string, event: any): Promise<void> {
    switch (topic) {
      case 'reservation.created':
        await this.handleReservationCreated(event);
        break;
      case 'reservation.updated':
        await this.handleReservationUpdated(event);
        break;
      case 'reservation.cancelled':
        await this.handleReservationCancelled(event);
        break;
      default:
        console.log(`Unhandled event topic: ${topic}`);
    }
  }

  private async handleReservationCreated(event: any): Promise<void> {
    console.log('Reservation created:', event.data.reservationId);
    // Aquí se podría realizar alguna acción cuando se crea una reserva
  }

  private async handleReservationUpdated(event: any): Promise<void> {
    console.log('Reservation updated:', event.data.reservationId);
    // Aquí se podría realizar alguna acción cuando se actualiza una reserva
  }

  private async handleReservationCancelled(event: any): Promise<void> {
    console.log('Reservation cancelled:', event.data.reservationId);
    // Aquí se podría realizar alguna acción cuando se cancela una reserva
  }
}
