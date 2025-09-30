export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum ReservationType {
  SURGERY = 'surgery',
  CONSULTATION = 'consultation',
  EMERGENCY = 'emergency',
  MAINTENANCE = 'maintenance',
}

export interface ReservationTimeSlot {
  startTime: Date;
  endTime: Date;
}

export interface ReservationConflict {
  reservationId: string;
  startTime: Date;
  endTime: Date;
  surgeonId: string;
}

export interface IdempotencyData {
  key: string;
  reservationId?: string;
  createdAt: Date;
  expiresAt: Date;
}
