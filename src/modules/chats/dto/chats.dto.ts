import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePrivateChatDto {
  @IsInt()
  targetUserId: number;
}

export class CreateGroupChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsArray()
  @IsInt({ each: true })
  participantIds: number[];
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}

export class AddParticipantDto {
  @IsInt()
  userId: number;
}
