import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperatingRoomsService } from './operating-rooms.service';
import { OperatingRoomsController } from './operating-rooms.controller';
import { OperatingRoom, OperatingRoomSchema } from './schemas/operating-room.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OperatingRoom.name, schema: OperatingRoomSchema }]),
  ],
  controllers: [OperatingRoomsController],
  providers: [OperatingRoomsService],
  exports: [OperatingRoomsService],
})
export class OperatingRoomsModule {}
