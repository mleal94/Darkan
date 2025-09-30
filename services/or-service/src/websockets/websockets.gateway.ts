import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/reservations',
})
export class ReservationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      this.connectedUsers.set(client.id, payload.sub);
      
      // Unir al usuario a una sala personalizada
      client.join(`user:${payload.sub}`);
      
      console.log(`User ${payload.sub} connected via WebSocket`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      console.log(`User ${userId} disconnected from WebSocket`);
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('join_room')
  @UseGuards(WsJwtGuard)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    client.join(`room:${data.roomId}`);
    client.emit('joined_room', { roomId: data.roomId });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    client.leave(`room:${data.roomId}`);
    client.emit('left_room', { roomId: data.roomId });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  // Métodos para emitir eventos a los clientes conectados
  emitReservationCreated(reservation: any): void {
    this.server.emit('reservation_created', reservation);
    
    // Emitir también a la sala específica del quirófano
    this.server.to(`room:${reservation.operatingRoomId}`).emit('reservation_created', reservation);
    
    // Emitir al usuario específico (cirujano)
    this.server.to(`user:${reservation.surgeonId}`).emit('reservation_created', reservation);
  }

  emitReservationUpdated(reservation: any): void {
    this.server.emit('reservation_updated', reservation);
    
    // Emitir también a la sala específica del quirófano
    this.server.to(`room:${reservation.operatingRoomId}`).emit('reservation_updated', reservation);
    
    // Emitir al usuario específico (cirujano)
    this.server.to(`user:${reservation.surgeonId}`).emit('reservation_updated', reservation);
  }

  emitReservationCancelled(reservation: any): void {
    this.server.emit('reservation_cancelled', reservation);
    
    // Emitir también a la sala específica del quirófano
    this.server.to(`room:${reservation.operatingRoomId}`).emit('reservation_cancelled', reservation);
    
    // Emitir al usuario específico (cirujano)
    this.server.to(`user:${reservation.surgeonId}`).emit('reservation_cancelled', reservation);
  }

  emitOperatingRoomStatusChanged(operatingRoom: any): void {
    this.server.emit('operating_room_status_changed', operatingRoom);
    this.server.to(`room:${operatingRoom.id}`).emit('operating_room_status_changed', operatingRoom);
  }
}
