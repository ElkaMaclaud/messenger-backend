import { IsEnum, IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { CallType } from '../call.entity/call.entity';

export class InitiateCallDto {
  @IsEnum(CallType)
  @IsOptional()
  type?: CallType;
}

export class AnswerCallDto {
  @IsString()
  @IsNotEmpty()
  sdpAnswer: string;
}

export class SdpOfferDto {
  @IsNumber()
  callId: number;

  @IsNumber()
  targetUserId: number;

  @IsNotEmpty()
  sdp: any;
}

export class IceCandidateDto {
  @IsNumber()
  callId: number;

  @IsNumber()
  targetUserId: number;

  @IsNotEmpty()
  candidate: any;
}

export class JoinChatDto {
  @IsNumber()
  chatId: number;
}
