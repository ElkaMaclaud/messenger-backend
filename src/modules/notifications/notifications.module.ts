import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { NotificationsService } from './notifications.service';
import { Notification } from './notifications/entities/notification.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MikroOrmModule.forFeature([Notification]), AuthModule],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
