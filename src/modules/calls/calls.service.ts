import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call, CallStatus, CallType } from './call.entity/call.entity';
import { Chat, ChatType } from '../chats/entity/chats.entity';
import { User } from '../users/user.entity/user.entity';

@Injectable()
export class CallsService {
  private callTimeouts = new Map<number, NodeJS.Timeout>();
  private readonly CALL_TIMEOUT_MS = 30000;

  constructor(
    @InjectRepository(Call)
    private callsRepository: Repository<Call>,
    @InjectRepository(Chat)
    private chatsRepository: Repository<Chat>,
  ) {}

  async initiateCall(
    chatId: number,
    callerId: number,
    type: CallType = CallType.VOICE,
  ): Promise<Call> {
    const chat = await this.chatsRepository.findOne({
      where: { id: chatId },
      relations: ['participants'],
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const isParticipant =
      chat.participants?.some((p) => p.id === callerId) ?? false;
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    let receiver: User | undefined;
    if (chat.type === ChatType.PRIVATE) {
      receiver = chat.participants?.find((p) => p.id !== callerId);
    }

    const call = this.callsRepository.create({
      chat,
      caller: { id: callerId } as User,
      receiver,
      type,
      status: CallStatus.INITIATED,
    });

    const savedCall = await this.callsRepository.save(call);

    this.setCallTimeout(savedCall.id);

    return savedCall;
  }

  async answerCall(
    callId: number,
    userId: number,
    sdpAnswer: string,
  ): Promise<Call> {
    const call = await this.callsRepository.findOne({
      where: { id: callId },
      relations: ['receiver', 'caller'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.receiver?.id !== userId) {
      throw new ForbiddenException('You are not the receiver of this call');
    }

    call.status = CallStatus.ACTIVE;
    call.sdpAnswer = sdpAnswer;
    call.startedAt = new Date();

    this.clearCallTimeout(callId);

    return this.callsRepository.save(call);
  }

  async getCallById(callId: number, userId: number): Promise<Call> {
    const call = await this.callsRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'receiver', 'chat'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    const chat = await this.chatsRepository.findOne({
      where: { id: call.chat.id },
      relations: ['participants'],
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const isParticipant =
      chat.participants?.some((p) => p.id === userId) ?? false;
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    return call;
  }

  async endCall(callId: number, userId: number): Promise<Call> {
    const call = await this.callsRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'receiver'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.caller.id !== userId && call.receiver?.id !== userId) {
      throw new ForbiddenException('You are not a participant of this call');
    }

    call.status = CallStatus.ENDED;
    call.endedAt = new Date();

    if (call.startedAt) {
      call.duration = Math.floor(
        (call.endedAt.getTime() - call.startedAt.getTime()) / 1000,
      );
    }

    this.clearCallTimeout(callId);

    return this.callsRepository.save(call);
  }

  async rejectCall(callId: number, userId: number): Promise<Call> {
    const call = await this.callsRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'receiver', 'chat'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.receiver?.id !== userId) {
      throw new ForbiddenException('You are not the receiver of this call');
    }

    if (call.status !== CallStatus.INITIATED && call.status !== CallStatus.RINGING) {
      throw new BadRequestException('Call cannot be rejected in current state');
    }

    call.status = CallStatus.REJECTED;
    call.endedAt = new Date();

    this.clearCallTimeout(callId);

    return this.callsRepository.save(call);
  }

  private setCallTimeout(callId: number): void {
    const timeout = setTimeout(async () => {
      await this.markCallAsMissed(callId);
    }, this.CALL_TIMEOUT_MS);

    this.callTimeouts.set(callId, timeout);
  }

  private clearCallTimeout(callId: number): void {
    const timeout = this.callTimeouts.get(callId);
    if (timeout) {
      clearTimeout(timeout);
      this.callTimeouts.delete(callId);
    }
  }

  private async markCallAsMissed(callId: number): Promise<void> {
    const call = await this.callsRepository.findOne({
      where: { id: callId },
    });

    if (call && (call.status === CallStatus.INITIATED || call.status === CallStatus.RINGING)) {
      call.status = CallStatus.MISSED;
      call.endedAt = new Date();
      await this.callsRepository.save(call);
    }

    this.callTimeouts.delete(callId);
  }

  async getCallHistory(chatId: number, userId: number): Promise<Call[]> {
    const chat = await this.chatsRepository.findOne({
      where: { id: chatId },
      relations: ['participants'],
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const isParticipant =
      chat.participants?.some((p) => p.id === userId) ?? false;
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    return this.callsRepository.find({
      where: { chat: { id: chatId } },
      relations: ['caller', 'receiver'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
