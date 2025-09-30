import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { File, FileDocument } from './schemas/file.schema';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { PresignedUrlResponseDto } from './dto/presigned-url-response.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { FileType, FileStatus, FileMetadata } from '../common/types/file.types';
import { S3Service } from './services/s3.service';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    private s3Service: S3Service,
    private kafkaService: KafkaService,
  ) {}

  async createPresignedUploadUrl(
    createPresignedUrlDto: CreatePresignedUrlDto,
    uploaderId: string,
    userRole?: string,
  ): Promise<PresignedUrlResponseDto> {
    // Validar tipo de archivo
    if (!this.s3Service.validateFileType(createPresignedUrlDto.mimeType, userRole)) {
      throw new BadRequestException('Tipo de archivo no permitido para tu rol');
    }

    // Validar tamaño si se proporciona
    if (createPresignedUrlDto.size && !this.s3Service.validateFileSize(createPresignedUrlDto.size)) {
      throw new BadRequestException('El archivo excede el tamaño máximo permitido (10MB)');
    }

    // Generar clave única para S3
    const s3Key = this.s3Service.generateFileKey(
      createPresignedUrlDto.reservationId,
      uploaderId,
      createPresignedUrlDto.originalName,
    );

    // Crear registro de archivo en la base de datos
    const fileMetadata: FileMetadata = {
      originalName: createPresignedUrlDto.originalName,
      mimeType: createPresignedUrlDto.mimeType,
      size: 0, // Se actualizará después del upload
      uploadedAt: new Date(),
    };

    const file = new this.fileModel({
      reservationId: createPresignedUrlDto.reservationId,
      uploaderId,
      type: createPresignedUrlDto.type,
      status: FileStatus.UPLOADING,
      s3Key,
      s3Bucket: process.env.S3_BUCKET || 'or-scheduler-files',
      metadata: fileMetadata,
      description: createPresignedUrlDto.description,
      tags: createPresignedUrlDto.tags,
      isPublic: createPresignedUrlDto.isPublic || false,
    });

    const savedFile = await file.save();

    // Generar URL presignada
    const presignedResult = await this.s3Service.createPresignedUploadUrl(
      s3Key,
      createPresignedUrlDto.mimeType,
      3600, // 1 hora
    );

    return {
      fileId: savedFile._id.toString(),
      uploadUrl: presignedResult.uploadUrl,
      key: presignedResult.key,
      expiresIn: presignedResult.expiresIn,
      expiresAt: new Date(Date.now() + presignedResult.expiresIn * 1000),
    };
  }

  async confirmUpload(confirmUploadDto: ConfirmUploadDto, uploaderId: string): Promise<FileResponseDto> {
    const file = await this.fileModel.findById(confirmUploadDto.fileId).exec();
    
    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }

    if (file.uploaderId !== uploaderId) {
      throw new BadRequestException('No tienes permisos para confirmar este archivo');
    }

    if (file.status !== FileStatus.UPLOADING) {
      throw new BadRequestException('El archivo ya fue procesado');
    }

    // Verificar que el archivo existe en S3
    const exists = await this.s3Service.fileExists(file.s3Key);
    if (!exists) {
      throw new BadRequestException('El archivo no se encontró en el almacenamiento');
    }

    // Actualizar estado del archivo
    file.status = FileStatus.UPLOADED;
    file.metadata.checksum = confirmUploadDto.etag;
    file.metadata.processedAt = new Date();

    // Generar URL de descarga
    file.downloadUrl = await this.s3Service.createPresignedDownloadUrl(file.s3Key);

    const updatedFile = await file.save();

    // Publicar evento en Kafka
    await this.kafkaService.publishFileAttached({
      fileId: updatedFile._id.toString(),
      reservationId: updatedFile.reservationId,
      uploaderId: updatedFile.uploaderId,
      type: updatedFile.type,
      s3Key: updatedFile.s3Key,
      metadata: updatedFile.metadata,
    });

    return this.mapToResponseDto(updatedFile);
  }

  async getFileById(id: string): Promise<FileResponseDto> {
    const file = await this.fileModel.findById(id).exec();
    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return this.mapToResponseDto(file);
  }

  async getFilesByReservation(reservationId: string): Promise<FileResponseDto[]> {
    const files = await this.fileModel.find({ reservationId }).exec();
    return files.map(file => this.mapToResponseDto(file));
  }

  async getFilesByUploader(uploaderId: string): Promise<FileResponseDto[]> {
    const files = await this.fileModel.find({ uploaderId }).exec();
    return files.map(file => this.mapToResponseDto(file));
  }

  async deleteFile(id: string, uploaderId: string): Promise<void> {
    const file = await this.fileModel.findById(id).exec();
    
    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }

    if (file.uploaderId !== uploaderId) {
      throw new BadRequestException('No tienes permisos para eliminar este archivo');
    }

    // Eliminar archivo de S3
    await this.s3Service.deleteFile(file.s3Key);

    // Marcar como eliminado en la base de datos
    file.status = FileStatus.DELETED;
    await file.save();
  }

  async getDownloadUrl(id: string, uploaderId: string): Promise<string> {
    const file = await this.fileModel.findById(id).exec();
    
    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }

    if (file.uploaderId !== uploaderId && !file.isPublic) {
      throw new BadRequestException('No tienes permisos para descargar este archivo');
    }

    if (file.status !== FileStatus.UPLOADED) {
      throw new BadRequestException('El archivo no está disponible para descarga');
    }

    // Generar nueva URL de descarga
    return this.s3Service.createPresignedDownloadUrl(file.s3Key, 3600);
  }

  private mapToResponseDto(file: FileDocument): FileResponseDto {
    return {
      id: file._id.toString(),
      reservationId: file.reservationId,
      uploaderId: file.uploaderId,
      type: file.type,
      status: file.status,
      s3Key: file.s3Key,
      s3Bucket: file.s3Bucket,
      metadata: file.metadata,
      description: file.description,
      tags: file.tags,
      isPublic: file.isPublic,
      downloadUrl: file.downloadUrl,
      thumbnailUrl: file.thumbnailUrl,
      errorMessage: file.errorMessage,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }
}
