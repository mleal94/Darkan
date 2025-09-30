import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CheckAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  operatingRoomId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsNotEmpty()
  surgeonId: string;
}
