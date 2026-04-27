import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import * as cookie from 'cookie';


@Injectable()
@WebSocketGateway({
  namespace: 'support',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate via cookie if present
      const cookies = client.handshake.headers.cookie;
      if (cookies) {
        const parsedCookies = cookie.parse(cookies);
        const token = parsedCookies['accessToken'];
        
        if (token) {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
          });
          
          client.data.user = {
            userId: payload.sub,
            role: payload.role,
          };
          this.logger.log(`Client authenticated: ${client.id} (User: ${payload.sub})`);
        }
      } else {
        this.logger.log(`Client connected as guest: ${client.id}`);
      }
    } catch (e) {
      this.logger.warn(`Client connection auth failed: ${client.id} - ${e.message}`);
      // Don't disconnect, they can still be a guest for their specific ticket
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTicket')
  async handleJoinTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.ticketId) return;
    const room = `ticket_${data.ticketId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leaveTicket')
  async handleLeaveTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.ticketId) return;
    const room = `ticket_${data.ticketId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { ticketId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.ticketId) return;
    
    // Default to USER if no role found
    const role = client.data.user?.role || 'USER';
    const room = `ticket_${data.ticketId}`;
    
    // Broadcast to others in the room
    client.to(room).emit('typing', {
      ticketId: data.ticketId,
      sender: role === 'ADMIN' ? 'ADMIN' : 'USER',
      isTyping: data.isTyping,
    });
  }

  // Helper method to broadcast new messages from the REST API
  broadcastNewMessage(ticketId: string, message: any) {
    this.server.to(`ticket_${ticketId}`).emit('newMessage', message);
  }

  // Helper method to broadcast status updates
  broadcastStatusUpdate(ticketId: string, status: string) {
    this.server.to(`ticket_${ticketId}`).emit('statusUpdated', { ticketId, status });
  }
}
