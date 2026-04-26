import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesGateway } from './messages.gateway';

@Module({
  imports: [JwtModule],
  providers: [MessagesGateway]
})
export class MessagesModule {}
