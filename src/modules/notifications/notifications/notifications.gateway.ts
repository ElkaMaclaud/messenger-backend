import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications.service';
import { PushSubscriptionDto } from '../dto/push-subscription.dto';
import { JWT_SECRET } from '../../../config/constants';

interface JwtPayload {
  sub: number;
  username: string;
}

interface SocketWithUser extends Socket {
  data: { userId: number };
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  handleConnection(client: SocketWithUser) {
    try {
      const auth = client.handshake.auth as { token?: string };
      const token = auth.token;

      if (!token || typeof token !== 'string') {
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify<JwtPayload>(token, { secret: JWT_SECRET });
      client.data.userId = decoded.sub;

      client.join(`user_${decoded.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: SocketWithUser) {}

  @SubscribeMessage('subscribe-push')
  async handleSubscribePush(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() subscription: PushSubscriptionDto,
  ) {
    try {
      await this.notificationsService.saveSubscription(client.data.userId, subscription);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  @SubscribeMessage('mark-as-read')
  async handleMarkAsRead(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: { notificationId: number },
  ) {
    try {
      await this.notificationsService.markAsRead(data.notificationId, client.data.userId);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  sendNotificationToUser(userId: number, notification: unknown) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }
}
