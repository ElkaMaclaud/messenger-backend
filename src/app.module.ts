import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatsModule } from './modules/chats/chats.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallsModule } from './modules/calls/calls.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5444),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'qwerty',
      database: process.env.DB_NAME ?? 'messenger_db',
      autoLoadEntities: true,
      synchronize: true, // в продакшене выключить и использовать миграции
    }),
    UsersModule,
    AuthModule,
    ChatsModule,
    CallsModule,
    FilesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
//В продакшене synchronize ставим false и используем миграции
