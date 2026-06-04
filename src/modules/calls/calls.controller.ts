import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CallsService } from './calls.service';
import { CallType, Call } from './call.entity/call.entity';
import { InitiateCallDto, AnswerCallDto } from './dto/calls.dto';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Post(':chatId/initiate')
  async initiateCall(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() body: InitiateCallDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Call> {
    return this.callsService.initiateCall(
      chatId,
      req.user.id,
      body.type || CallType.VOICE,
    );
  }

  @Post(':callId/answer')
  async answerCall(
    @Param('callId', ParseIntPipe) callId: number,
    @Body() body: AnswerCallDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<Call> {
    return this.callsService.answerCall(callId, req.user.id, body.sdpAnswer);
  }

  @Post(':callId/end')
  async endCall(
    @Param('callId', ParseIntPipe) callId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Call> {
    return this.callsService.endCall(callId, req.user.id);
  }

  @Post(':callId/reject')
  async rejectCall(
    @Param('callId', ParseIntPipe) callId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Call> {
    return this.callsService.rejectCall(callId, req.user.id);
  }

  @Get('chat/:chatId/history')
  async getCallHistory(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Call[]> {
    return this.callsService.getCallHistory(chatId, req.user.id);
  }

  @Get(':callId')
  async getCall(
    @Param('callId', ParseIntPipe) callId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<Call> {
    return this.callsService.getCallById(callId, req.user.id);
  }
}
