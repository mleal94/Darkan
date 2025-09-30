import { UserResponseDto } from '../../users/dto/user-response.dto';

export class RegisterResponseDto {
  user: UserResponseDto;
  message: string;
}

