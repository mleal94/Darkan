import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token || 
                  client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new WsException('Token no proporcionado');
    }

    try {
      const payload = this.jwtService.verify(token);
      client.user = payload;
      return true;
    } catch (error) {
      throw new WsException('Token inválido');
    }
  }
}
