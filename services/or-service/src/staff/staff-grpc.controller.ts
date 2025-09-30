import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthGrpcService } from '../common/services/auth-grpc.service';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { ReservationStatus } from '../common/types/reservation.types';

@Controller()
export class StaffGrpcController {
  constructor(
    private readonly authGrpcService: AuthGrpcService,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
  ) {
    console.log('✅ StaffGrpcController initialized');
  }

  @GrpcMethod('StaffService', 'CheckStaffAvailability')
  async checkStaffAvailability(data: {
    staffId: string;
    startTime: number;
    endTime: number;
    staffType: string;
  }) {
    console.log('🔍 StaffGrpcController.checkStaffAvailability called with:', data);
    console.log('🔍 staffType value:', data.staffType, 'type:', typeof data.staffType);
    console.log('🔍 startTime:', data.startTime, 'type:', typeof data.startTime);
    console.log('🔍 endTime:', data.endTime, 'type:', typeof data.endTime);
    try {
      // Verificar que el staff existe via AuthService
      const user = await this.authGrpcService.getUserById(data.staffId);
      
      if (!user || !user.isActive) {
        return {
          available: false,
          reason: 'Staff no encontrado o inactivo',
          conflicts: [],
          staffInfo: null,
        };
      }

      // Verificar que el tipo de staff coincide
      if (user.role !== data.staffType) {
        return {
          available: false,
          reason: `El usuario no es de tipo ${data.staffType}`,
          conflicts: [],
          staffInfo: null,
        };
      }

      // Buscar conflictos de horario directamente
      const startTime = new Date(Number(data.startTime));
      const endTime = new Date(Number(data.endTime));
      
      // Validar que las fechas sean válidas
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return {
          available: false,
          reason: 'Fechas inválidas proporcionadas',
          conflicts: [],
          staffInfo: null,
        };
      }
      
      const conflicts = await this.reservationModel.find({
        surgeonId: data.staffId,
        status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
        ],
      }).exec();

      if (conflicts.length > 0) {
        return {
          available: false,
          reason: 'Staff tiene conflictos de horario',
          conflicts: conflicts.map(conflict => ({
            startTime: new Date(conflict.startTime).getTime(),
            endTime: new Date(conflict.endTime).getTime(),
            reservationId: conflict._id.toString(),
            description: 'Reserva existente',
          })),
          staffInfo: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department || 'General',
            isActive: user.isActive,
            specializations: user.specializations || [],
            maxConcurrentReservations: user.maxConcurrentReservations || 1,
            currentReservations: user.currentReservations || 0,
          },
        };
      }

      return {
        available: true,
        reason: 'Staff disponible',
        conflicts: [],
        staffInfo: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || 'General',
          isActive: user.isActive,
          specializations: user.specializations || [],
          maxConcurrentReservations: user.maxConcurrentReservations || 1,
          currentReservations: user.currentReservations || 0,
        },
      };
    } catch (error) {
      console.error('Error checking staff availability:', error);
      return {
        available: false,
        reason: 'Error al verificar disponibilidad del staff',
        conflicts: [],
        staffInfo: null,
      };
    }
  }

  @GrpcMethod('StaffService', 'GetStaffSchedule')
  async getStaffSchedule(data: {
    staffId: string;
    startDate: number;
    endDate: number;
  }) {
    try {
      // Obtener reservas del staff en el rango de fechas
      const reservations = await this.reservationModel.find({
        surgeonId: data.staffId,
        startTime: { $gte: new Date(data.startDate) },
        endTime: { $lte: new Date(data.endDate) },
      }).sort({ startTime: 1 }).exec();

      return {
        staffId: data.staffId,
        schedule: reservations.map(reservation => ({
          startTime: new Date(reservation.startTime).getTime(),
          endTime: new Date(reservation.endTime).getTime(),
          reservationId: reservation._id.toString(),
          operatingRoomId: reservation.operatingRoomId,
          patientName: reservation.patientName || '',
          surgeryType: reservation.type || 'surgery',
          status: reservation.status,
        })),
      };
    } catch (error) {
      console.error('Error getting staff schedule:', error);
      return {
        staffId: data.staffId,
        schedule: [],
      };
    }
  }

  @GrpcMethod('StaffService', 'ValidateStaffAssignment')
  async validateStaffAssignment(data: {
    staffId: string;
    operatingRoomId: string;
    startTime: number;
    endTime: number;
    surgeryType: string;
  }) {
    try {
      const user = await this.authGrpcService.getUserById(data.staffId);
      
      if (!user) {
        return {
          valid: false,
          message: 'Staff no encontrado',
          requiredSpecializations: [],
          staffSpecializations: [],
        };
      }

      // Verificar especializaciones requeridas
      const requiredSpecializations = this.getRequiredSpecializations(data.surgeryType);
      const staffSpecializations = user.specializations || [];

      const hasRequiredSpecializations = requiredSpecializations.every(spec =>
        staffSpecializations.includes(spec)
      );

      if (!hasRequiredSpecializations) {
        return {
          valid: false,
          message: 'Staff no tiene las especializaciones requeridas para este tipo de cirugía',
          requiredSpecializations,
          staffSpecializations,
        };
      }

      return {
        valid: true,
        message: 'Staff válido para la asignación',
        requiredSpecializations,
        staffSpecializations,
      };
    } catch (error) {
      console.error('Error validating staff assignment:', error);
      return {
        valid: false,
        message: 'Error al validar asignación del staff',
        requiredSpecializations: [],
        staffSpecializations: [],
      };
    }
  }

  private getRequiredSpecializations(surgeryType: string): string[] {
    const specializationsMap: { [key: string]: string[] } = {
      'cardiac': ['cardiac_surgery', 'general_surgery'],
      'neurosurgery': ['neurosurgery', 'general_surgery'],
      'orthopedic': ['orthopedic_surgery', 'general_surgery'],
      'plastic': ['plastic_surgery', 'general_surgery'],
      'general': ['general_surgery'],
      'emergency': ['emergency_surgery', 'general_surgery'],
    };

    return specializationsMap[surgeryType.toLowerCase()] || ['general_surgery'];
  }
}
