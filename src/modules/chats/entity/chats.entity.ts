import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity/user.entity';
import { Message } from './message.entity';
import { Call } from '../../calls/call.entity/call.entity';

export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
}

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ChatType,
    default: ChatType.PRIVATE,
  })
  type: ChatType;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @ManyToMany(() => User, (user) => user.chats)
  @JoinTable()
  participants: User[];

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];

  @OneToMany(() => Call, (call) => call.chat)
  calls: Call[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
