import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  private userSockets = new Map<number, string>();

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const decoded = this.jwtService.verify(token);
      this.userSockets.set(decoded.id, client.id);

      client.join(`user_${decoded.id}`);

      console.log(`User ${decoded.id} connected`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('call:offer')
  handleCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      callId: number;
      targetUserId: number;
      offer: RTCSessionDescriptionInit;
    },
  ) {
    this.server.to(`user_${data.targetUserId}`).emit('call:offer', {
      callId: data.callId,
      offer: data.offer,
      fromUserId: this.getUserIdBySocket(client),
    });
  }

  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      callId: number;
      targetUserId: number;
      answer: RTCSessionDescriptionInit;
    },
  ) {
    this.server.to(`user_${data.targetUserId}`).emit('call:answer', {
      callId: data.callId,
      answer: data.answer,
      fromUserId: this.getUserIdBySocket(client),
    });
  }

  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      callId: number;
      targetUserId: number;
      candidate: RTCIceCandidateInit;
    },
  ) {
    this.server.to(`user_${data.targetUserId}`).emit('call:ice-candidate', {
      callId: data.callId,
      candidate: data.candidate,
      fromUserId: this.getUserIdBySocket(client),
    });
  }

  @SubscribeMessage('call:end')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      callId: number;
      targetUserId: number;
    },
  ) {
    this.server.to(`user_${data.targetUserId}`).emit('call:end', {
      callId: data.callId,
      fromUserId: this.getUserIdBySocket(client),
    });
  }

  private getUserIdBySocket(client: Socket): number {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        return userId;
      }
    }
    return null;
  }
}
