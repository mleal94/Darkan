import { IsString, IsDateString, IsEnum, IsOptional, IsBoolean, IsUUID, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationType } from '../../common/types/reservation.types';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  operatingRoomId: string;

  @IsString()
  @IsNotEmpty()
  surgeonId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsEnum(ReservationType)
  @IsOptional()
  type?: ReservationType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  patientName?: string;

  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurringPattern?: string;

  @IsString()
  @IsOptional()
  parentReservationId?: string;
}
