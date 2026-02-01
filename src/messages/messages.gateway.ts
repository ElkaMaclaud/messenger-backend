import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  id: number;
  username: string;
}

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
    const auth = client.handshake.auth as { token?: string };
    const token = auth.token;

    if (!token || typeof token !== 'string') {
      client.disconnect();
      return;
    }

    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);
      this.userSockets.set(decoded.id, client.id);
      client.join(`user_${decoded.id}`);
      console.log(`User ${decoded.id} connected`);
    } catch {
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
    const fromUserId = this.getUserIdBySocket(client);
    if (fromUserId) {
      this.server.to(`user_${data.targetUserId}`).emit('call:offer', {
        callId: data.callId,
        offer: data.offer,
        fromUserId,
      });
    }
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
    const fromUserId = this.getUserIdBySocket(client);
    if (fromUserId) {
      this.server.to(`user_${data.targetUserId}`).emit('call:answer', {
        callId: data.callId,
        answer: data.answer,
        fromUserId,
      });
    }
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
    const fromUserId = this.getUserIdBySocket(client);
    if (fromUserId) {
      this.server.to(`user_${data.targetUserId}`).emit('call:ice-candidate', {
        callId: data.callId,
        candidate: data.candidate,
        fromUserId,
      });
    }
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
    const fromUserId = this.getUserIdBySocket(client);
    if (fromUserId) {
      this.server.to(`user_${data.targetUserId}`).emit('call:end', {
        callId: data.callId,
        fromUserId,
      });
    }
  }

  private getUserIdBySocket(client: Socket): number | null {
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        return userId;
      }
    }
    return null;
  }
}
