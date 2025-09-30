import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface StaffServiceGrpc {
  CheckStaffAvailability(data: CheckStaffAvailabilityRequest): Observable<CheckStaffAvailabilityResponse>;
  GetStaffSchedule(data: GetStaffScheduleRequest): Observable<GetStaffScheduleResponse>;
  ValidateStaffAssignment(data: ValidateStaffAssignmentRequest): Observable<ValidateStaffAssignmentResponse>;
}

interface CheckStaffAvailabilityRequest {
  staffId: string;
  startTime: number;
  endTime: number;
  staffType: string;
}

interface CheckStaffAvailabilityResponse {
  available: boolean;
  reason: string;
  conflicts: TimeSlot[];
  staffInfo: StaffInfo;
}

interface TimeSlot {
  startTime: number;
  endTime: number;
  reservationId: string;
  description: string;
}

interface StaffInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  specializations: string[];
  maxConcurrentReservations: number;
  currentReservations: number;
}

interface GetStaffScheduleRequest {
  staffId: string;
  startDate: number;
  endDate: number;
}

interface GetStaffScheduleResponse {
  staffId: string;
  schedule: ScheduleEntry[];
}

interface ScheduleEntry {
  startTime: number;
  endTime: number;
  reservationId: string;
  operatingRoomId: string;
  patientName: string;
  surgeryType: string;
  status: string;
}

interface ValidateStaffAssignmentRequest {
  staffId: string;
  operatingRoomId: string;
  startTime: number;
  endTime: number;
  surgeryType: string;
}

interface ValidateStaffAssignmentResponse {
  valid: boolean;
  message: string;
  requiredSpecializations: string[];
  staffSpecializations: string[];
}

@Injectable()
export class StaffGrpcService implements OnModuleInit {
  private staffService: StaffServiceGrpc;

  constructor(@Inject('STAFF_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    // Retrasar la inicialización del cliente gRPC para evitar problemas de dependencias
    setTimeout(() => {
      this.staffService = this.client.getService<StaffServiceGrpc>('StaffService');
      console.log('✅ StaffGrpcService client initialized');
    }, 1000);
  }

  async checkStaffAvailability(
    staffId: string,
    startTime: Date,
    endTime: Date,
    staffType: string,
  ): Promise<CheckStaffAvailabilityResponse> {
    try {
      if (!this.staffService) {
        console.warn('StaffGrpcService not initialized yet, using fallback validation');
        return { 
          available: true, 
          reason: 'Staff service not ready, allowing reservation', 
          conflicts: [], 
          staffInfo: null 
        };
      }

      const response = await this.staffService.CheckStaffAvailability({
        staffId,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        staffType,
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error checking staff availability via gRPC:', error.message);
      return { 
        available: false, 
        reason: 'Error al verificar disponibilidad del staff', 
        conflicts: [], 
        staffInfo: null 
      };
    }
  }

  async getStaffSchedule(
    staffId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<GetStaffScheduleResponse> {
    try {
      const response = await this.staffService.GetStaffSchedule({
        staffId,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error getting staff schedule via gRPC:', error.message);
      return { staffId, schedule: [] };
    }
  }

  async validateStaffAssignment(
    staffId: string,
    operatingRoomId: string,
    startTime: Date,
    endTime: Date,
    surgeryType: string,
  ): Promise<ValidateStaffAssignmentResponse> {
    try {
      const response = await this.staffService.ValidateStaffAssignment({
        staffId,
        operatingRoomId,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        surgeryType,
      }).toPromise();
      return response;
    } catch (error) {
      console.error('Error validating staff assignment via gRPC:', error.message);
      return { 
        valid: false, 
        message: 'Error al validar asignación del staff', 
        requiredSpecializations: [], 
        staffSpecializations: [] 
      };
    }
  }

  // Método específico para validar disponibilidad de cirujano
  async validateSurgeonAvailability(
    surgeonId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<boolean> {
    const response = await this.checkStaffAvailability(
      surgeonId,
      startTime,
      endTime,
      'surgeon',
    );
    return response.available;
  }
}
