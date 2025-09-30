export enum FileType {
  CONSENT = 'consent',
  STUDY = 'study',
  IMAGE = 'image',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export enum FileStatus {
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
  DELETED = 'deleted',
}

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  checksum?: string;
  uploadedAt: Date;
  processedAt?: Date;
}

export interface S3UploadResult {
  key: string;
  bucket: string;
  location: string;
  etag: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}
