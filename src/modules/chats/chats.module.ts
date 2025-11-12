import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { User } from '../users/user.entity';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Message, User]),
    AuthModule,
  ],
  providers: [ChatsService, ChatsGateway],
  controllers: [ChatsController],
})
export class ChatsModule {}