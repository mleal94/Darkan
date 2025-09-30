import { IsString, IsObject, IsBoolean, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OperatingRoomEquipment, OperatingRoomCapacity, OperatingRoomLocation } from '../../common/types/operating-room.types';

export class CreateOperatingRoomEquipmentDto implements OperatingRoomEquipment {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsBoolean()
  isRequired: boolean;
}

export class CreateOperatingRoomCapacityDto implements OperatingRoomCapacity {
  @IsNumber()
  maxPatients: number;

  @IsNumber()
  maxStaff: number;
}

export class CreateOperatingRoomLocationDto implements OperatingRoomLocation {
  @IsNumber()
  floor: number;

  @IsString()
  wing: string;

  @IsString()
  roomNumber: string;
}

export class CreateOperatingRoomDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @ValidateNested()
  @Type(() => CreateOperatingRoomLocationDto)
  location: CreateOperatingRoomLocationDto;

  @ValidateNested()
  @Type(() => CreateOperatingRoomCapacityDto)
  capacity: CreateOperatingRoomCapacityDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOperatingRoomEquipmentDto)
  @IsOptional()
  equipment?: CreateOperatingRoomEquipmentDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  maxReservationsPerDay?: number;
}
