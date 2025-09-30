import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { CreatePresignedUrlDto } from './dto/create-presigned-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { PresignedUrlResponseDto } from './dto/presigned-url-response.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/types/user.types';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presign')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER, UserRole.SURGEON)
  async createPresignedUploadUrl(
    @Body() createPresignedUrlDto: CreatePresignedUrlDto,
    @Request() req,
  ): Promise<PresignedUrlResponseDto> {
    return this.filesService.createPresignedUploadUrl(createPresignedUrlDto, req.user.sub, req.user.role);
  }

  @Post('confirm-upload')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER, UserRole.SURGEON)
  async confirmUpload(
    @Body() confirmUploadDto: ConfirmUploadDto,
    @Request() req,
  ): Promise<FileResponseDto> {
    return this.filesService.confirmUpload(confirmUploadDto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async getAllFiles(): Promise<FileResponseDto[]> {
    // En un caso real, esto debería tener paginación
    return [];
  }

  @Get('my-files')
  async getMyFiles(@Request() req): Promise<FileResponseDto[]> {
    return this.filesService.getFilesByUploader(req.user.sub);
  }

  @Get('reservation/:reservationId')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER, UserRole.SURGEON)
  async getFilesByReservation(
    @Param('reservationId') reservationId: string,
  ): Promise<FileResponseDto[]> {
    return this.filesService.getFilesByReservation(reservationId);
  }

  @Get(':id')
  async getFileById(@Param('id') id: string): Promise<FileResponseDto> {
    return this.filesService.getFileById(id);
  }

  @Get(':id/download')
  async getDownloadUrl(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ downloadUrl: string }> {
    const downloadUrl = await this.filesService.getDownloadUrl(id, req.user.sub);
    return { downloadUrl };
  }

  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.filesService.deleteFile(id, req.user.sub);
    return { message: 'Archivo eliminado correctamente' };
  }

  @Get('admin/test')
  async testEndpoint(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'File Service is working correctly',
      timestamp: new Date().toISOString(),
    };
  }
}
