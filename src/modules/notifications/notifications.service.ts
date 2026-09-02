import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from './notifications/entities/notification.entity';
import * as webPush from 'web-push';

// Временно отключим VAPID для тестирования
// Получите реальные ключи: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'test-public-key';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'test-private-key';
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.org';

if (VAPID_PUBLIC_KEY !== 'test-public-key') {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class NotificationsService {
  private userSubscriptions = new Map<number, PushSubscription[]>();

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async saveSubscription(
    userId: number,
    subscription: PushSubscription,
  ): Promise<void> {
    const subscriptions = this.userSubscriptions.get(userId) || [];
    const exists = subscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint,
    );

    if (!exists) {
      subscriptions.push(subscription);
      this.userSubscriptions.set(userId, subscriptions);
    }
  }

  async createNotification(
    userId: number,
    title: string,
    body: string,
    type: NotificationType,
    relatedId?: number,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      title,
      body,
      type,
      relatedId,
      data,
      isRead: false,
    });

    const saved = await this.notificationRepository.save(notification);

    this.sendPushNotification(userId, { title, body, data }).catch(
      console.error,
    );

    return saved;
  }

  private async sendPushNotification(
    userId: number,
    payload: { title: string; body: string; data?: Record<string, any> },
  ): Promise<void> {
    const subscriptions = this.userSubscriptions.get(userId);

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    if (VAPID_PUBLIC_KEY === 'test-public-key') {
      console.log('Push notifications disabled (test mode)');
      return;
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/icon.png',
      data: payload.data,
    });

    const promises = subscriptions.map((subscription) => {
      return webPush
        .sendNotification(subscription, pushPayload)
        .catch((error: any) => {
          console.error('Push notification failed:', error);
          if (error.statusCode === 410) {
            this.removeSubscription(userId, subscription.endpoint);
          }
        });
    });

    await Promise.all(promises);
  }

  private removeSubscription(userId: number, endpoint: string): void {
    const subscriptions = this.userSubscriptions.get(userId);
    if (subscriptions) {
      const filtered = subscriptions.filter((sub) => sub.endpoint !== endpoint);
      this.userSubscriptions.set(userId, filtered);
    }
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
}
