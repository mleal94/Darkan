import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { S3Service } from './services/s3.service';
import { File, FileSchema } from './schemas/file.schema';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    KafkaModule,
  ],
  controllers: [FilesController],
  providers: [FilesService, S3Service],
  exports: [FilesService, S3Service],
})
export class FilesModule {}
