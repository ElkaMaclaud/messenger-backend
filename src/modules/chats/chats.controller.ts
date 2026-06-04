import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatsService } from './chats.service';
import {
  CreatePrivateChatDto,
  CreateGroupChatDto,
  SendMessageDto,
  AddParticipantDto,
} from './dto/chats.dto';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post('private')
  async createPrivateChat(
    @Body() body: CreatePrivateChatDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.createPrivateChat(req.user.id, body.targetUserId);
  }

  @Post('group')
  async createGroupChat(
    @Body() body: CreateGroupChatDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.createGroupChat(
      req.user.id,
      body.name,
      body.participantIds,
    );
  }

  @Get()
  async getUserChats(@Request() req: AuthenticatedRequest) {
    return this.chatsService.getUserChats(req.user.id);
  }

  @Get(':id')
  async getChat(
    @Param('id', ParseIntPipe) chatId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.getChat(chatId, req.user.id);
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param('id', ParseIntPipe) chatId: number,
    @Request() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.chatsService.getChatMessages(chatId, req.user.id, page, limit);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id', ParseIntPipe) chatId: number,
    @Body() body: SendMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.sendMessage(chatId, req.user.id, body.content);
  }

  @Post(':id/participants')
  async addParticipant(
    @Param('id', ParseIntPipe) chatId: number,
    @Body() body: AddParticipantDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.addParticipant(chatId, req.user.id, body.userId);
  }

  @Delete(':id/participants/:userId')
  async removeParticipant(
    @Param('id', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.removeParticipant(
      chatId,
      req.user.id,
      targetUserId,
    );
  }
}
