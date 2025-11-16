import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { CallsService } from './calls.service';
import { CallType } from './call.entity/call.entity';

interface JwtPayload {
  sub: number;
  username: string;
  iat: number;
  exp: number;
}

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

interface CallResponse {
  success: boolean;
  call?: any;
  error?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/calls',
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, string>();

  constructor(
    private jwtService: JwtService,
    private callsService: CallsService,
  ) {}

  handleConnection(socket: AuthenticatedSocket) {
    try {
      const token = socket.handshake.auth.token as string;
      const payload = this.jwtService.verify<JwtPayload>(token);
      socket.user = payload;

      this.userSockets.set(payload.sub, socket.id);
      console.log(`User ${payload.username} connected to calls gateway`);

      socket.join(`user_${payload.sub}`);
    } catch (error) {
      console.log(error);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    if (socket.user) {
      this.userSockets.delete(socket.user.sub);
      console.log(
        `User ${socket.user.username} disconnected from calls gateway`,
      );
    }
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(socket: AuthenticatedSocket, chatId: number): void {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.user.username} joined chat ${chatId}`);
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(socket: AuthenticatedSocket, chatId: number): void {
    socket.leave(`chat_${chatId}`);
    console.log(`User ${socket.user.username} left chat ${chatId}`);
  }

  @SubscribeMessage('initiate_call')
  async handleInitiateCall(
    socket: AuthenticatedSocket,
    data: { chatId: number; type: string },
  ): Promise<CallResponse> {
    try {
      const call = await this.callsService.initiateCall(
        data.chatId,
        socket.user.sub,
        data.type as CallType,
      );

      this.server.to(`chat_${data.chatId}`).emit('incoming_call', {
        callId: call.id,
        caller: call.caller,
        type: call.type,
        chatId: data.chatId,
      });

      return { success: true, call };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('answer_call')
  async handleAnswerCall(
    socket: AuthenticatedSocket,
    data: { callId: number; sdpAnswer: string },
  ): Promise<CallResponse> {
    try {
      const call = await this.callsService.answerCall(
        data.callId,
        socket.user.sub,
        data.sdpAnswer,
      );

      const callerSocketId = this.userSockets.get(call.caller.id);
      if (callerSocketId) {
        this.server.to(callerSocketId).emit('call_accepted', {
          callId: call.id,
          sdpAnswer: data.sdpAnswer,
        });
      }

      return { success: true, call };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('end_call')
  async handleEndCall(
    socket: AuthenticatedSocket,
    callId: number,
  ): Promise<CallResponse> {
    try {
      const call = await this.callsService.endCall(callId, socket.user.sub);

      this.server.to(`chat_${call.chat.id}`).emit('call_ended', {
        callId: call.id,
        duration: call.duration,
      });

      return { success: true, call };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('ice_candidate')
  handleIceCandidate(
    socket: AuthenticatedSocket,
    data: { callId: number; candidate: unknown; targetUserId: number },
  ): void {
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('ice_candidate', {
        callId: data.callId,
        candidate: data.candidate,
      });
    }
  }

  @SubscribeMessage('sdp_offer')
  handleSdpOffer(
    socket: AuthenticatedSocket,
    data: { callId: number; sdp: unknown; targetUserId: number },
  ): void {
    const targetSocketId = this.userSockets.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('sdp_offer', {
        callId: data.callId,
        sdp: data.sdp,
      });
    }
  }
}
