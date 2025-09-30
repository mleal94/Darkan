import { PresignedUrlResult } from '../../common/types/file.types';

export class PresignedUrlResponseDto implements PresignedUrlResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  fileId: string;
  expiresAt: Date;
}
