import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Chat } from './chat.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User, user => user.messages)
  author: User;

  @ManyToOne(() => Chat, chat => chat.messages)
  chat: Chat;

  @CreateDateColumn()
  createdAt: Date;
}