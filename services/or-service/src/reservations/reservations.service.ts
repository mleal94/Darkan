import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { Idempotency, IdempotencyDocument } from './schemas/idempotency.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { ReservationStatus, ReservationType, ReservationConflict } from '../common/types/reservation.types';
import { OperatingRoomsService } from '../operating-rooms/operating-rooms.service';
import { KafkaService } from '../kafka/kafka.service';
import { AuthGrpcService } from '../common/services/auth-grpc.service';
import { StaffGrpcService } from '../common/services/staff-grpc.service';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Idempotency.name) private idempotencyModel: Model<IdempotencyDocument>,
    private operatingRoomsService: OperatingRoomsService,
    private kafkaService: KafkaService,
    private authGrpcService: AuthGrpcService,
    private staffGrpcService: StaffGrpcService,
    private outboxService: OutboxService,  
  ) {}

  async createReservation(
    createReservationDto: CreateReservationDto,
    idempotencyKey?: string,
  ): Promise<ReservationResponseDto> {
    try {
      // Verificar idempotencia
      if (idempotencyKey) {
        const existingIdempotency = await this.idempotencyModel.findOne({ key: idempotencyKey });
        if (existingIdempotency) {
          if (existingIdempotency.reservationId) {
            // Si ya existe una reserva con esta clave, devolver la reserva existente
            const existingReservation = await this.reservationModel.findById(existingIdempotency.reservationId);
            if (existingReservation) {
              return this.mapToResponseDto(existingReservation);
            }
          }
          throw new ConflictException('Procesando reserva con esta clave de idempotencia');
        }
      }

      // Validar disponibilidad del cirujano via gRPC
      const isSurgeonAvailable = await this.staffGrpcService.validateSurgeonAvailability(
        createReservationDto.surgeonId,
        new Date(createReservationDto.startTime),
        new Date(createReservationDto.endTime)
      );
      if (!isSurgeonAvailable) {
        throw new ConflictException('El cirujano no está disponible o no es válido');
      }

      // Validar disponibilidad
      await this.validateAvailability(createReservationDto);

      // Verificar que el quirófano esté disponible
      const isAvailable = await this.operatingRoomsService.isOperatingRoomAvailable(
        createReservationDto.operatingRoomId
      );
      if (!isAvailable) {
        throw new ConflictException('El quirófano no está disponible');
      }

      // Crear reserva
      const reservation = new this.reservationModel({
        ...createReservationDto,
        startTime: new Date(createReservationDto.startTime),
        endTime: new Date(createReservationDto.endTime),
        idempotencyKey,
      });

      const savedReservation = await reservation.save();

      // Crear registro de idempotencia si existe la clave
      if (idempotencyKey) {
        await this.idempotencyModel.create({
          key: idempotencyKey,
          reservationId: savedReservation._id.toString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
          status: 'completed',
        });
      }

      // Incrementar contador de reservas del quirófano
      await this.operatingRoomsService.incrementReservationCount(createReservationDto.operatingRoomId);

      // Crear evento en Outbox para publicación asíncrona
      await this.outboxService.createOutboxEvent(
        'reservation.created',
        savedReservation._id.toString(),
        'reservation',
        {
          reservationId: savedReservation._id.toString(),
          operatingRoomId: savedReservation.operatingRoomId,
          surgeonId: savedReservation.surgeonId,
          startTime: savedReservation.startTime,
          endTime: savedReservation.endTime,
          status: savedReservation.status,
          type: savedReservation.type,
          description: savedReservation.description,
        },
      );

      return this.mapToResponseDto(savedReservation);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la reserva: ' + error.message);
    }
  }

  async getAllReservations(): Promise<ReservationResponseDto[]> {
    const reservations = await this.reservationModel.find().exec();
    return reservations.map(reservation => this.mapToResponseDto(reservation));
  }

  async getReservationById(id: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return this.mapToResponseDto(reservation);
  }

  async getReservationsByOperatingRoom(operatingRoomId: string): Promise<ReservationResponseDto[]> {
    const reservations = await this.reservationModel.find({ operatingRoomId }).exec();
    return reservations.map(reservation => this.mapToResponseDto(reservation));
  }

  async getReservationsBySurgeon(surgeonId: string): Promise<ReservationResponseDto[]> {
    const reservations = await this.reservationModel.find({ surgeonId }).exec();
    return reservations.map(reservation => this.mapToResponseDto(reservation));
  }

  async updateReservation(id: string, updateReservationDto: UpdateReservationDto): Promise<ReservationResponseDto> {
    try {
      const reservation = await this.reservationModel.findById(id);
      if (!reservation) {
        throw new NotFoundException('Reserva no encontrada');
      }

      const previousStatus = reservation.status;

      // Si se está cambiando el horario, validar disponibilidad
      if (updateReservationDto.startTime || updateReservationDto.endTime) {
        const checkDto: CheckAvailabilityDto = {
          operatingRoomId: updateReservationDto.operatingRoomId || reservation.operatingRoomId,
          surgeonId: updateReservationDto.surgeonId || reservation.surgeonId,
          startTime: updateReservationDto.startTime || reservation.startTime.toISOString(),
          endTime: updateReservationDto.endTime || reservation.endTime.toISOString(),
        };
        await this.validateAvailability(checkDto, id);
      }

      // Actualizar versión para control de concurrencia
      const updateData = {
        ...updateReservationDto,
        version: reservation.version + 1,
      };

      if (updateReservationDto.startTime) {
        (updateData as any).startTime = new Date(updateReservationDto.startTime);
      }
      if (updateReservationDto.endTime) {
        (updateData as any).endTime = new Date(updateReservationDto.endTime);
      }

      const updatedReservation = await this.reservationModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      // Publicar evento de actualización
      await this.kafkaService.publishReservationUpdated({
        reservationId: updatedReservation._id.toString(),
        operatingRoomId: updatedReservation.operatingRoomId,
        surgeonId: updatedReservation.surgeonId,
        startTime: updatedReservation.startTime,
        endTime: updatedReservation.endTime,
        status: updatedReservation.status,
        type: updatedReservation.type,
        description: updatedReservation.description,
        previousStatus,
      });

      return this.mapToResponseDto(updatedReservation);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la reserva: ' + error.message);
    }
  }

  async cancelReservation(id: string, reason?: string): Promise<ReservationResponseDto> {
    try {
      const reservation = await this.reservationModel.findById(id);
      if (!reservation) {
        throw new NotFoundException('Reserva no encontrada');
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
        throw new BadRequestException('La reserva ya está cancelada');
      }

      const cancelledReservation = await this.reservationModel.findByIdAndUpdate(
        id,
        { 
          status: ReservationStatus.CANCELLED,
          notes: reason ? `${reservation.notes || ''}\nCancelada: ${reason}`.trim() : reservation.notes,
          version: reservation.version + 1,
        },
        { new: true }
      );

      // Decrementar contador de reservas del quirófano
      await this.operatingRoomsService.decrementReservationCount(reservation.operatingRoomId);

      // Publicar evento de cancelación
      await this.kafkaService.publishReservationCancelled({
        reservationId: cancelledReservation._id.toString(),
        operatingRoomId: cancelledReservation.operatingRoomId,
        surgeonId: cancelledReservation.surgeonId,
        reason,
        cancelledBy: 'system', // En un caso real, esto vendría del usuario autenticado
      });

      return this.mapToResponseDto(cancelledReservation);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al cancelar la reserva: ' + error.message);
    }
  }

  async checkAvailability(checkAvailabilityDto: CheckAvailabilityDto): Promise<{ available: boolean; conflicts?: ReservationConflict[] }> {
    const conflicts = await this.findConflicts(checkAvailabilityDto);
    return {
      available: conflicts.length === 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }

  private async validateAvailability(createReservationDto: CreateReservationDto | CheckAvailabilityDto, excludeId?: string): Promise<void> {
    const startTime = new Date(createReservationDto.startTime);
    const endTime = new Date(createReservationDto.endTime);

    // Validar que la fecha de inicio sea anterior a la de fin
    if (startTime >= endTime) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    // Validar que no sea en el pasado
    if (startTime < new Date()) {
      throw new BadRequestException('No se pueden crear reservas en el pasado');
    }

    // Buscar conflictos
    const query: any = {
      operatingRoomId: createReservationDto.operatingRoomId,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const conflicts = await this.reservationModel.find(query).exec();

    if (conflicts.length > 0) {
      throw new ConflictException('Existe un conflicto de horarios con otra reserva');
    }
  }

  private async findConflicts(checkAvailabilityDto: CheckAvailabilityDto): Promise<ReservationConflict[]> {
    const startTime = new Date(checkAvailabilityDto.startTime);
    const endTime = new Date(checkAvailabilityDto.endTime);

    const conflicts = await this.reservationModel.find({
      operatingRoomId: checkAvailabilityDto.operatingRoomId,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    }).exec();

    return conflicts.map(conflict => ({
      reservationId: conflict._id.toString(),
      startTime: conflict.startTime,
      endTime: conflict.endTime,
      surgeonId: conflict.surgeonId,
    }));
  }

  private mapToResponseDto(reservation: ReservationDocument): ReservationResponseDto {
    return {
      id: reservation._id.toString(),
      operatingRoomId: reservation.operatingRoomId,
      surgeonId: reservation.surgeonId,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status,
      type: reservation.type,
      description: reservation.description,
      patientName: reservation.patientName,
      patientId: reservation.patientId,
      notes: reservation.notes,
      isRecurring: reservation.isRecurring,
      recurringPattern: reservation.recurringPattern,
      parentReservationId: reservation.parentReservationId,
      version: reservation.version,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}
