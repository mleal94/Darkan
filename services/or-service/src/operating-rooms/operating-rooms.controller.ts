import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OperatingRoomsService } from './operating-rooms.service';
import { CreateOperatingRoomDto } from './dto/create-operating-room.dto';
import { UpdateOperatingRoomDto } from './dto/update-operating-room.dto';
import { OperatingRoomResponseDto } from './dto/operating-room-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/types/user.types';

@Controller('operating-rooms')
@UseGuards(JwtAuthGuard)
export class OperatingRoomsController {
  constructor(private readonly operatingRoomsService: OperatingRoomsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async createOperatingRoom(@Body() createOperatingRoomDto: CreateOperatingRoomDto): Promise<OperatingRoomResponseDto> {
    return this.operatingRoomsService.createOperatingRoom(createOperatingRoomDto);
  }

  @Get()
  async getAllOperatingRooms(): Promise<OperatingRoomResponseDto[]> {
    return this.operatingRoomsService.getAllOperatingRooms();
  }

  @Get('active')
  async getActiveOperatingRooms(): Promise<OperatingRoomResponseDto[]> {
    return this.operatingRoomsService.getActiveOperatingRooms();
  }

  @Get(':id')
  async getOperatingRoomById(@Param('id') id: string): Promise<OperatingRoomResponseDto> {
    return this.operatingRoomsService.getOperatingRoomById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async updateOperatingRoom(
    @Param('id') id: string,
    @Body() updateOperatingRoomDto: UpdateOperatingRoomDto,
  ): Promise<OperatingRoomResponseDto> {
    return this.operatingRoomsService.updateOperatingRoom(id, updateOperatingRoomDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteOperatingRoom(@Param('id') id: string): Promise<{ message: string }> {
    await this.operatingRoomsService.deleteOperatingRoom(id);
    return { message: 'Quirófano eliminado correctamente' };
  }

  @Get('admin/test')
  async testEndpoint(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'Operating Rooms Service is working correctly',
      timestamp: new Date().toISOString(),
    };
  }
}
