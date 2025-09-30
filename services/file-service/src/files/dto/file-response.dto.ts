import { FileType, FileStatus, FileMetadata } from '../../common/types/file.types';

export class FileResponseDto {
  id: string;
  reservationId: string;
  uploaderId: string;
  type: FileType;
  status: FileStatus;
  s3Key: string;
  s3Bucket: string;
  metadata: FileMetadata;
  description?: string;
  tags?: string[];
  isPublic: boolean;
  downloadUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
