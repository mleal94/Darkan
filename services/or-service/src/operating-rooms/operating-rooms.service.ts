import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperatingRoom, OperatingRoomDocument } from './schemas/operating-room.schema';
import { CreateOperatingRoomDto } from './dto/create-operating-room.dto';
import { UpdateOperatingRoomDto } from './dto/update-operating-room.dto';
import { OperatingRoomResponseDto } from './dto/operating-room-response.dto';

@Injectable()
export class OperatingRoomsService {
  constructor(
    @InjectModel(OperatingRoom.name) private operatingRoomModel: Model<OperatingRoomDocument>,
  ) {}

  async createOperatingRoom(createOperatingRoomDto: CreateOperatingRoomDto): Promise<OperatingRoomResponseDto> {
    try {
      const operatingRoom = new this.operatingRoomModel(createOperatingRoomDto);
      const savedOperatingRoom = await operatingRoom.save();
      return this.mapToResponseDto(savedOperatingRoom);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('El nombre del quirófano ya está en uso');
      }
      throw error;
    }
  }

  async getAllOperatingRooms(): Promise<OperatingRoomResponseDto[]> {
    const operatingRooms = await this.operatingRoomModel.find().exec();
    return operatingRooms.map(room => this.mapToResponseDto(room));
  }

  async getActiveOperatingRooms(): Promise<OperatingRoomResponseDto[]> {
    const operatingRooms = await this.operatingRoomModel.find({ 
      isActive: true,
      isMaintenance: false 
    }).exec();
    return operatingRooms.map(room => this.mapToResponseDto(room));
  }

  async getOperatingRoomById(id: string): Promise<OperatingRoomResponseDto> {
    const operatingRoom = await this.operatingRoomModel.findById(id).exec();
    if (!operatingRoom) {
      throw new NotFoundException('Quirófano no encontrado');
    }
    return this.mapToResponseDto(operatingRoom);
  }

  async updateOperatingRoom(id: string, updateOperatingRoomDto: UpdateOperatingRoomDto): Promise<OperatingRoomResponseDto> {
    const operatingRoom = await this.operatingRoomModel.findByIdAndUpdate(
      id,
      updateOperatingRoomDto,
      { new: true, runValidators: true }
    ).exec();

    if (!operatingRoom) {
      throw new NotFoundException('Quirófano no encontrado');
    }

    return this.mapToResponseDto(operatingRoom);
  }

  async deleteOperatingRoom(id: string): Promise<void> {
    const result = await this.operatingRoomModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Quirófano no encontrado');
    }
  }

  async incrementReservationCount(operatingRoomId: string): Promise<void> {
    await this.operatingRoomModel.findByIdAndUpdate(
      operatingRoomId,
      { $inc: { currentReservations: 1 } }
    ).exec();
  }

  async decrementReservationCount(operatingRoomId: string): Promise<void> {
    await this.operatingRoomModel.findByIdAndUpdate(
      operatingRoomId,
      { $inc: { currentReservations: -1 } }
    ).exec();
  }

  async isOperatingRoomAvailable(operatingRoomId: string): Promise<boolean> {
    const operatingRoom = await this.operatingRoomModel.findById(operatingRoomId).exec();
    return operatingRoom && operatingRoom.isActive && !operatingRoom.isMaintenance;
  }

  private mapToResponseDto(operatingRoom: OperatingRoomDocument): OperatingRoomResponseDto {
    return {
      id: operatingRoom._id.toString(),
      name: operatingRoom.name,
      description: operatingRoom.description,
      location: operatingRoom.location,
      capacity: operatingRoom.capacity,
      equipment: operatingRoom.equipment,
      isActive: operatingRoom.isActive,
      isMaintenance: operatingRoom.isMaintenance,
      maintenanceNotes: operatingRoom.maintenanceNotes,
      currentReservations: operatingRoom.currentReservations,
      maxReservationsPerDay: operatingRoom.maxReservationsPerDay,
      createdAt: operatingRoom.createdAt,
      updatedAt: operatingRoom.updatedAt,
    };
  }
}
