import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatsService } from './chats.service';
import { Chat } from './entity/chats.entity';

interface SocketWithUserData extends Socket {
  data: {
    userId: number;
  };
}

interface JwtPayload {
  sub: number;
  username: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private chatsService: ChatsService,
  ) {}

  private connectedUsers = new Map<number, string>();

  async handleConnection(socket: SocketWithUserData): Promise<void> {
    try {
      const auth = socket.handshake.auth as { token?: unknown };
      const token = typeof auth.token === 'string' ? auth.token : undefined;

      if (!token) {
        socket.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: 'super_secret_key',
      });

      const userId = payload.sub;

      this.connectedUsers.set(userId, socket.id);
      socket.data.userId = userId;

      const userChats = await this.chatsService.getUserChats(userId);
      userChats.forEach((chat) => {
        socket.join(`chat_${chat.id}`);
      });

      console.log(`User ${userId} connected`);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: SocketWithUserData): void {
    if (socket.data.userId) {
      this.connectedUsers.delete(socket.data.userId);
      console.log(`User ${socket.data.userId} disconnected`);
    }
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(socket: Socket, chatId: number): void {
    socket.join(`chat_${chatId}`);
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(socket: Socket, chatId: number): void {
    socket.leave(`chat_${chatId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    socket: SocketWithUserData,
    data: { chatId: number; content: string },
  ): Promise<{ success: boolean; message?: unknown; error?: string }> {
    try {
      const userId = socket.data.userId;
      const message = await this.chatsService.sendMessage(
        data.chatId,
        userId,
        data.content,
      );

      this.server.to(`chat_${data.chatId}`).emit('new_message', message);

      return { success: true, message };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(socket: SocketWithUserData, chatId: number): void {
    const userId = socket.data.userId;
    socket.to(`chat_${chatId}`).emit('user_typing', { userId, typing: true });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(socket: SocketWithUserData, chatId: number): void {
    const userId = socket.data.userId;
    socket.to(`chat_${chatId}`).emit('user_typing', { userId, typing: false });
  }

  notifyNewChat(chat: Chat): void {
    chat.participants.forEach((participant) => {
      const socketId = this.connectedUsers.get(participant.id);
      if (socketId) {
        this.server.to(socketId).emit('new_chat', chat);
        this.server.to(socketId).socketsJoin(`chat_${chat.id}`);
      }
    });
  }
}
