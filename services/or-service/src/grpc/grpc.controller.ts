import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OperatingRoomsService } from '../operating-rooms/operating-rooms.service';
import { ReservationsService } from '../reservations/reservations.service';

interface GetOperatingRoomByIdRequest {
  operatingRoomId: string;
}

interface GetReservationByIdRequest {
  reservationId: string;
}

interface CheckAvailabilityRequest {
  operatingRoomId: string;
  surgeonId: string;
  startTime: number;
  endTime: number;
}

interface ValidateReservationRequest {
  operatingRoomId: string;
  surgeonId: string;
  startTime: number;
  endTime: number;
  excludeReservationId?: string;
}

@Controller()
export class GrpcController {
  constructor(
    private operatingRoomsService: OperatingRoomsService,
    private reservationsService: ReservationsService,
  ) {}

  @GrpcMethod('ORService', 'GetOperatingRoomById')
  async getOperatingRoomById(data: GetOperatingRoomByIdRequest) {
    try {
      const operatingRoom = await this.operatingRoomsService.getOperatingRoomById(data.operatingRoomId);
      return {
        id: operatingRoom.id,
        name: operatingRoom.name,
        description: operatingRoom.description,
        isActive: operatingRoom.isActive,
        isMaintenance: operatingRoom.isMaintenance,
        currentReservations: operatingRoom.currentReservations,
        maxReservationsPerDay: operatingRoom.maxReservationsPerDay,
      };
    } catch (error) {
      throw new Error('Quirófano no encontrado');
    }
  }

  @GrpcMethod('ORService', 'GetReservationById')
  async getReservationById(data: GetReservationByIdRequest) {
    try {
      const reservation = await this.reservationsService.getReservationById(data.reservationId);
      return {
        id: reservation.id,
        operatingRoomId: reservation.operatingRoomId,
        surgeonId: reservation.surgeonId,
        startTime: reservation.startTime.getTime(),
        endTime: reservation.endTime.getTime(),
        status: reservation.status,
        type: reservation.type,
        description: reservation.description || '',
        patientName: reservation.patientName || '',
        patientId: reservation.patientId || '',
        notes: reservation.notes || '',
        isRecurring: reservation.isRecurring,
        recurringPattern: reservation.recurringPattern || '',
        parentReservationId: reservation.parentReservationId || '',
        version: reservation.version,
      };
    } catch (error) {
      throw new Error('Reserva no encontrada');
    }
  }

  @GrpcMethod('ORService', 'CheckAvailability')
  async checkAvailability(data: CheckAvailabilityRequest) {
    try {
      const result = await this.reservationsService.checkAvailability({
        operatingRoomId: data.operatingRoomId,
        surgeonId: data.surgeonId,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      });

      return {
        available: result.available,
        conflicts: result.conflicts?.map(conflict => ({
          reservationId: conflict.reservationId,
          startTime: conflict.startTime.getTime(),
          endTime: conflict.endTime.getTime(),
          surgeonId: conflict.surgeonId,
        })) || [],
      };
    } catch (error) {
      return {
        available: false,
        conflicts: [],
      };
    }
  }

  @GrpcMethod('ORService', 'ValidateReservation')
  async validateReservation(data: ValidateReservationRequest) {
    try {
      await this.reservationsService['validateAvailability']({
        operatingRoomId: data.operatingRoomId,
        surgeonId: data.surgeonId,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      }, data.excludeReservationId);

      return {
        valid: true,
        message: 'Reserva válida',
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message || 'Reserva inválida',
      };
    }
  }
}
