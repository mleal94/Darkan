import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { FileType, FileStatus, FileMetadata } from '../../common/types/file.types';

export type FileDocument = File & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true })
  reservationId: string;

  @Prop({ required: true })
  uploaderId: string;

  @Prop({ 
    type: String, 
    enum: Object.values(FileType), 
    required: true 
  })
  type: FileType;

  @Prop({ 
    type: String, 
    enum: Object.values(FileStatus), 
    default: FileStatus.UPLOADING 
  })
  status: FileStatus;

  @Prop({ required: true })
  s3Key: string;

  @Prop({ required: true })
  s3Bucket: string;

  @Prop({ required: true, type: Object })
  metadata: FileMetadata;

  @Prop()
  description?: string;

  @Prop()
  tags?: string[];

  @Prop({ default: false })
  isPublic: boolean;

  @Prop()
  downloadUrl?: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  errorMessage?: string;
}

export const FileSchema = SchemaFactory.createForClass(File);

// Índices
FileSchema.index({ reservationId: 1 });
FileSchema.index({ uploaderId: 1 });
FileSchema.index({ type: 1 });
FileSchema.index({ status: 1 });
FileSchema.index({ s3Key: 1 }, { unique: true });
FileSchema.index({ createdAt: 1 });
