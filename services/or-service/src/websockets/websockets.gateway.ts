import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// JWT y autenticación removidos - WebSocket sin autenticación

@WebSocketGateway({
  namespace: '/reservations',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
 export class ReservationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor() {
    console.log('🔌 WebSocket Gateway initialized for namespace: /reservations (no authentication)');
  }

  afterInit(server: Server) {
    const port = process.env.OR_SERVICE_PORT || 3002;
    const namespace = '/reservations';
    console.log('🔌 WebSocket Server initialized and ready for connections');
    console.log(`🔌 WebSocket URL: ws://localhost:${port}${namespace}`);
    console.log(`🔌 WebSocket Port: ${port}`);
    console.log(`🔌 WebSocket Namespace: ${namespace}`);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      console.log('🔌 WebSocket connection attempt from:', client.handshake.address);
      
      // Conexión sin autenticación - todos los usuarios son anónimos
      this.connectedUsers.set(client.id, 'anonymous');
      console.log('👤 User connected via WebSocket (no authentication required)');
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      console.log(`👋 User ${userId} disconnected from WebSocket`);
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    console.log('🚪 User joining room:', data.roomId);
    client.join(`room:${data.roomId}`);
    client.emit('joined_room', { roomId: data.roomId });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    console.log('🚪 User leaving room:', data.roomId);
    client.leave(`room:${data.roomId}`);
    client.emit('left_room', { roomId: data.roomId });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    console.log('🏓 Ping received from client:', client.id);
    client.emit('pong', { 
      timestamp: new Date().toISOString(),
      message: 'pong from server'
    });
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
