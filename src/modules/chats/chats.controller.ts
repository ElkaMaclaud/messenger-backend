import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatsService } from './chats.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
  };
}

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post('private')
  async createPrivateChat(
    @Body() body: { targetUserId: number },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.createPrivateChat(req.user.id, body.targetUserId);
  }

  @Post('group')
  async createGroupChat(
    @Body() body: { name: string; participantIds: number[] },
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
    @Param('id') chatId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.getChat(chatId, req.user.id);
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param('id') chatId: number,
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.chatsService.getChatMessages(chatId, req.user.id, page, limit);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') chatId: number,
    @Body() body: { content: string },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.sendMessage(chatId, req.user.id, body.content);
  }

  @Post(':id/participants')
  async addParticipant(
    @Param('id') chatId: number,
    @Body() body: { userId: number },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.addParticipant(chatId, req.user.id, body.userId);
  }

  @Delete(':id/participants/:userId')
  async removeParticipant(
    @Param('id') chatId: number,
    @Param('userId') targetUserId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatsService.removeParticipant(
      chatId,
      req.user.id,
      targetUserId,
    );
  }
}
