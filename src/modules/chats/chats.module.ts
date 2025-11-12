import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entity/chats.entity';
import { Message } from './entity/message.entity';
import { User } from '../users/user.entity/user.entity';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Message, User]), AuthModule],
  providers: [ChatsService, ChatsGateway],
  controllers: [ChatsController],
})
export class ChatsModule {}
