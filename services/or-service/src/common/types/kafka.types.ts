export interface KafkaEvent {
  eventType: string;
  eventId: string;
  timestamp: Date;
  data: any;
  version: string;
}

export interface ReservationCreatedEvent extends KafkaEvent {
  eventType: 'reservation.created';
  data: {
    reservationId: string;
    operatingRoomId: string;
    surgeonId: string;
    startTime: Date;
    endTime: Date;
    status: string;
    type: string;
    description?: string;
  };
}

export interface ReservationUpdatedEvent extends KafkaEvent {
  eventType: 'reservation.updated';
  data: {
    reservationId: string;
    operatingRoomId: string;
    surgeonId: string;
    startTime: Date;
    endTime: Date;
    status: string;
    type: string;
    description?: string;
    previousStatus?: string;
  };
}

export interface ReservationCancelledEvent extends KafkaEvent {
  eventType: 'reservation.cancelled';
  data: {
    reservationId: string;
    operatingRoomId: string;
    surgeonId: string;
    reason?: string;
    cancelledBy: string;
  };
}
