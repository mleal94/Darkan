import { PartialType } from '@nestjs/mapped-types';
import { CreateOperatingRoomDto } from './create-operating-room.dto';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateOperatingRoomDto extends PartialType(CreateOperatingRoomDto) {
  @IsOptional()
  @IsString()
  maintenanceNotes?: string;

  @IsOptional()
  @IsBoolean()
  isMaintenance?: boolean;
}
