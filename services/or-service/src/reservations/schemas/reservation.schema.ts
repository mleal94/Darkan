import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ReservationStatus, ReservationType } from '../../common/types/reservation.types';

export type ReservationDocument = Reservation & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ required: true })
  operatingRoomId: string;

  @Prop({ required: true })
  surgeonId: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ 
    type: String, 
    enum: Object.values(ReservationStatus), 
    default: ReservationStatus.PENDING 
  })
  status: ReservationStatus;

  @Prop({ 
    type: String, 
    enum: Object.values(ReservationType), 
    default: ReservationType.SURGERY 
  })
  type: ReservationType;

  @Prop()
  description?: string;

  @Prop()
  patientName?: string;

  @Prop()
  patientId?: string;

  @Prop()
  notes?: string;

  @Prop({ sparse: true })
  idempotencyKey?: string;

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop()
  recurringPattern?: string;

  @Prop()
  parentReservationId?: string;

  @Prop({ default: 0 })
  version: number;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// Índices para prevenir solapamientos
ReservationSchema.index({ operatingRoomId: 1, startTime: 1, endTime: 1 });
ReservationSchema.index({ surgeonId: 1, startTime: 1, endTime: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
ReservationSchema.index({ startTime: 1, endTime: 1 });
