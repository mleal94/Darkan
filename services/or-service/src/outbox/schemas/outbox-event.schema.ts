import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OutboxEventDocument = OutboxEvent & Document & {
  createdAt: Date;
  updatedAt: Date;
};

export enum OutboxEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class OutboxEvent {
  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  aggregateId: string;

  @Prop({ required: true })
  aggregateType: string;

  @Prop({ required: true, type: Object })
  payload: any;

  @Prop({ 
    type: String, 
    enum: Object.values(OutboxEventStatus), 
    default: OutboxEventStatus.PENDING 
  })
  status: OutboxEventStatus;

  @Prop()
  errorMessage?: string;

  @Prop()
  retryCount: number;

  @Prop()
  processedAt?: Date;

  @Prop()
  nextRetryAt?: Date;
}

export const OutboxEventSchema = SchemaFactory.createForClass(OutboxEvent);

// Índices
OutboxEventSchema.index({ status: 1, nextRetryAt: 1 });
OutboxEventSchema.index({ eventType: 1 });
OutboxEventSchema.index({ aggregateId: 1, aggregateType: 1 });
