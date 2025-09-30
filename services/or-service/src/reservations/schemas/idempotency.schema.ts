import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IdempotencyDocument = Idempotency & Document;

@Schema({ timestamps: true })
export class Idempotency {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop()
  reservationId?: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 'pending' })
  status: string;
}

export const IdempotencySchema = SchemaFactory.createForClass(Idempotency);

// Índice TTL para limpiar automáticamente las claves expiradas
IdempotencySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
