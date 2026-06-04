import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { CallsGateway } from './calls.gateway';
import { Call } from './call.entity/call.entity';
import { Chat } from '../chats/entity/chats.entity';
import { JWT_SECRET } from '../../config/constants';

@Module({
  imports: [TypeOrmModule.forFeature([Call, Chat]), JwtModule.register({ secret: JWT_SECRET })],
  providers: [CallsService, CallsGateway],
  controllers: [CallsController],
  exports: [CallsService],
})
export class CallsModule {}
