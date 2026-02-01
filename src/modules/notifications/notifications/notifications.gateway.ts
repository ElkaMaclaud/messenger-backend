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
import { NotificationsService } from './notifications.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

interface JwtPayload {
  id: number;
  username: string;
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, string>();

  constructor(
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const auth = client.handshake.auth as { token?: string };
      const token = auth.token;

      if (!token || typeof token !== 'string') {
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify<JwtPayload>(token);
      this.connectedUsers.set(decoded.id, client.id);

      client.join(`user_${decoded.id}`);
      console.log(`User ${decoded.id} connected to notifications`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('subscribe-push')
  async handleSubscribePush(
    @ConnectedSocket() client: Socket,
    @MessageBody() subscription: PushSubscriptionDto,
  ) {
    try {
      const auth = client.handshake.auth as { token?: string };
      const token = auth.token;
      const decoded = this.jwtService.verify<JwtPayload>(token);

      await this.notificationsService.saveSubscription(
        decoded.id,
        subscription,
      );
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  @SubscribeMessage('mark-as-read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: number },
  ) {
    try {
      const auth = client.handshake.auth as { token?: string };
      const token = auth.token;
      const decoded = this.jwtService.verify<JwtPayload>(token);

      await this.notificationsService.markAsRead(
        data.notificationId,
        decoded.id,
      );
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  sendToAll(notification: any) {
    this.server.emit('notification', notification);
  }
}
