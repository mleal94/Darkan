import { ReservationStatus, ReservationType } from '../../common/types/reservation.types';

export class ReservationResponseDto {
  id: string;
  operatingRoomId: string;
  surgeonId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  type: ReservationType;
  description?: string;
  patientName?: string;
  patientId?: string;
  notes?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  parentReservationId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
