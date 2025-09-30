import { OperatingRoomEquipment, OperatingRoomCapacity, OperatingRoomLocation } from '../../common/types/operating-room.types';

export class OperatingRoomResponseDto {
  id: string;
  name: string;
  description: string;
  location: OperatingRoomLocation;
  capacity: OperatingRoomCapacity;
  equipment: OperatingRoomEquipment[];
  isActive: boolean;
  isMaintenance: boolean;
  maintenanceNotes?: string;
  currentReservations: number;
  maxReservationsPerDay: number;
  createdAt: Date;
  updatedAt: Date;
}
