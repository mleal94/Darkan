import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesModule } from './files/files.module';
import { KafkaModule } from './kafka/kafka.module';
import { CommonModule } from './common/module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/or_scheduler'),
    FilesModule,
    KafkaModule,
    CommonModule,
  ],
})
export class AppModule {}
