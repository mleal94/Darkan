import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OperatingRoomEquipment, OperatingRoomCapacity, OperatingRoomLocation } from '../../common/types/operating-room.types';

export type OperatingRoomDocument = OperatingRoom & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class OperatingRoom {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Object })
  location: OperatingRoomLocation;

  @Prop({ required: true, type: Object })
  capacity: OperatingRoomCapacity;

  @Prop({ type: [Object], default: [] })
  equipment: OperatingRoomEquipment[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isMaintenance: boolean;

  @Prop()
  maintenanceNotes?: string;

  @Prop({ default: 0 })
  currentReservations: number;

  @Prop({ default: 0 })
  maxReservationsPerDay: number;
}

export const OperatingRoomSchema = SchemaFactory.createForClass(OperatingRoom);

// Índices
OperatingRoomSchema.index({ name: 1 }, { unique: true });
OperatingRoomSchema.index({ isActive: 1 });
OperatingRoomSchema.index({ 'location.floor': 1, 'location.wing': 1 });
