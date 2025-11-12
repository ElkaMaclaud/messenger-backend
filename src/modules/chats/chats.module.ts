import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { User } from '../users/user.entity';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Message, User]),
  ],
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class ChatsModule {}