import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Headers,
  Query,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/types/user.types';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER, UserRole.SURGEON)
  async createReservation(
    @Body() createReservationDto: CreateReservationDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ReservationResponseDto> {
    return this.reservationsService.createReservation(createReservationDto, idempotencyKey);
  }

  @Post('check-availability')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER, UserRole.SURGEON)
  async checkAvailability(@Body() checkAvailabilityDto: CheckAvailabilityDto) {
    return this.reservationsService.checkAvailability(checkAvailabilityDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async getAllReservations(): Promise<ReservationResponseDto[]> {
    return this.reservationsService.getAllReservations();
  }

  @Get('my-reservations')
  async getMyReservations(@Request() req): Promise<ReservationResponseDto[]> {
    return this.reservationsService.getReservationsBySurgeon(req.user.sub);
  }

  @Get('operating-room/:operatingRoomId')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async getReservationsByOperatingRoom(
    @Param('operatingRoomId') operatingRoomId: string,
  ): Promise<ReservationResponseDto[]> {
    return this.reservationsService.getReservationsByOperatingRoom(operatingRoomId);
  }

  @Get('surgeon/:surgeonId')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async getReservationsBySurgeon(
    @Param('surgeonId') surgeonId: string,
  ): Promise<ReservationResponseDto[]> {
    return this.reservationsService.getReservationsBySurgeon(surgeonId);
  }

  @Get(':id')
  async getReservationById(@Param('id') id: string): Promise<ReservationResponseDto> {
    return this.reservationsService.getReservationById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async updateReservation(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ): Promise<ReservationResponseDto> {
    return this.reservationsService.updateReservation(id, updateReservationDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async cancelReservation(
    @Param('id') id: string,
    @Query('reason') reason?: string,
  ): Promise<ReservationResponseDto> {
    return this.reservationsService.cancelReservation(id, reason);
  }

  @Get('admin/test')
  async testEndpoint(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'Reservations Service is working correctly',
      timestamp: new Date().toISOString(),
    };
  }
}
