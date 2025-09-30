import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmUploadDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsString()
  @IsNotEmpty()
  etag: string;
}
