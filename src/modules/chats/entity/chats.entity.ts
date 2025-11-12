import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Message } from './message.entity';

export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group'
}

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ChatType,
    default: ChatType.PRIVATE
  })
  type: ChatType;

  @Column({ nullable: true })
  name: string;

  @ManyToMany(() => User, user => user.chats)
  @JoinTable()
  participants: User[];

  @OneToMany(() => Message, message => message.chat)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;
}