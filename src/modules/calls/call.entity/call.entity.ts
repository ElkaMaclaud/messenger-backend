import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Chat } from '../../chats/entity/chats.entity';
import { User } from '../../users/user.entity/user.entity';

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ACTIVE = 'active',
  ENDED = 'ended',
  MISSED = 'missed',
  REJECTED = 'rejected',
}

export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
}

@Entity()
export class Call {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chat, (chat) => chat.calls)
  chat: Chat;

  @ManyToOne(() => User)
  caller: User;

  @ManyToOne(() => User, { nullable: true })
  receiver?: User;

  @Column({
    type: 'enum',
    enum: CallStatus,
    default: CallStatus.INITIATED,
  })
  status: CallStatus;

  @Column({
    type: 'enum',
    enum: CallType,
    default: CallType.VOICE,
  })
  type: CallType;

  @Column({ nullable: true })
  sdpOffer?: string;

  @Column({ nullable: true })
  sdpAnswer?: string;

  @Column({ nullable: true })
  iceCandidates?: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @CreateDateColumn()
  createdAt: Date;
}
