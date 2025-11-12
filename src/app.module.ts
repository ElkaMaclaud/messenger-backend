import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatsModule } from './modules/chats/chats.module';
import { ChatEntityTsModule } from './modules/chat.entity.ts/chat.entity.ts.module';
import { ChatsService } from './modules/chats/chats.service';
import { ChatsService } from './modules/chats/chats/chats.service';
import { ChatsController } from './modules/chats/chats/chats.controller';
import { ChatsModule } from './modules/chats/chats.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '',
      database: 'messenger_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ChatsModule,
    ChatEntityTsModule,
  ],
  providers: [ChatsService],
  controllers: [ChatsController],
})
export class AppModule {}
//В продакшене synchronize ставим false и используем миграции