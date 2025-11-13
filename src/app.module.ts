import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatsModule } from './modules/chats/chats.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallsModule } from './modules/calls/calls.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'qwerty', // локальный тестовый пока
      database: 'messenger_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ChatsModule,
    CallsModule,
  ],
})
export class AppModule {}
//В продакшене synchronize ставим false и используем миграции
