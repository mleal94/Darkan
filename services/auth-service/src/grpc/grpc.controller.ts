import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../common/types/user.types';

interface GetUserByIdRequest {
  userId: string;
}

interface GetUserPermissionsRequest {
  userId: string;
}

interface ValidateTokenRequest {
  token: string;
}

interface GetUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface GetUserPermissionsResponse {
  userId: string;
  permissions: string[];
  role: string;
}

interface ValidateTokenResponse {
  valid: boolean;
  userId: string;
  role: string;
  permissions: string[];
}

@Controller()
export class GrpcController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @GrpcMethod('AuthService', 'GetUserById')
  async getUserById(data: GetUserByIdRequest): Promise<GetUserResponse> {
    const user = await this.usersService.findUserById(data.userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime(),
    };
  }

  @GrpcMethod('AuthService', 'GetUserPermissions')
  async getUserPermissions(data: GetUserPermissionsRequest): Promise<GetUserPermissionsResponse> {
    const user = await this.usersService.findUserById(data.userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const permissions = await this.authService.getUserPermissions(data.userId);

    return {
      userId: user.id,
      permissions,
      role: user.role,
    };
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    try {
      const { JwtService } = await import('@nestjs/jwt');
      const jwtService = new JwtService({
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      const payload = jwtService.verify(data.token) as any;
      const user = await this.usersService.findUserById(payload.sub);
      
      if (!user || !user.isActive) {
        return {
          valid: false,
          userId: '',
          role: '',
          permissions: [],
        };
      }

      const permissions = await this.authService.getUserPermissions(user.id);

      return {
        valid: true,
        userId: user.id,
        role: user.role,
        permissions,
      };
    } catch (error) {
      return {
        valid: false,
        userId: '',
        role: '',
        permissions: [],
      };
    }
  }
}
