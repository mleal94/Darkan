import { IsString, IsEnum, IsOptional, IsArray, IsBoolean, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { FileType } from '../../common/types/file.types';

export class CreatePresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  reservationId: string;

  @IsEnum(FileType)
  type: FileType;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsNumber()
  @Min(1)
  @Max(10485760) // 10MB en bytes
  @IsOptional()
  size?: number;
}
