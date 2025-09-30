import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface AuthService {
  GetUserById(data: { userId: string }): Observable<any>;
  GetUserPermissions(data: { userId: string }): Observable<any>;
  ValidateToken(data: { token: string }): Observable<any>;
}

@Injectable()
export class AuthGrpcService implements OnModuleInit {
  private authService: AuthService;

  constructor(@Inject('AUTH_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthService>('AuthService');
  }

  async getUserById(userId: string): Promise<any> {
    return this.authService.GetUserById({ userId }).toPromise();
  }

  async getUserPermissions(userId: string): Promise<any> {
    return this.authService.GetUserPermissions({ userId }).toPromise();
  }

  async validateToken(token: string): Promise<any> {
    return this.authService.ValidateToken({ token }).toPromise();
  }

  async validateSurgeonAvailability(surgeonId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(surgeonId);
      return user && user.isActive && user.role === 'surgeon';
    } catch (error) {
      console.error('Error validating surgeon availability:', error);
      return false;
    }
  }
}
