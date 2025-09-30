import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignedUrlResult } from '../../common/types/file.types';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin123',
      },
      forcePathStyle: true, // Necesario para MinIO
    });
    this.bucketName = process.env.S3_BUCKET || 'or-scheduler-files';
  }

  async createPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600, // 1 hora por defecto
  ): Promise<PresignedUrlResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    return {
      uploadUrl,
      key,
      expiresIn,
    };
  }

  async createPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  generateFileKey(reservationId: string, uploaderId: string, originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `reservations/${reservationId}/${uploaderId}/${timestamp}_${sanitizedName}`;
  }

  validateFileType(mimeType: string, userRole?: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
    ];

    // Validación básica de tipos permitidos
    if (!allowedTypes.includes(mimeType)) {
      return false;
    }

    // Validaciones específicas por rol
    if (userRole === 'surgeon') {
      // Los cirujanos solo pueden subir ciertos tipos de archivos
      const surgeonAllowedTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'text/plain',
      ];
      return surgeonAllowedTypes.includes(mimeType);
    }

    return true;
  }

  validateFileSize(size: number): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return size <= maxSize;
  }
}
