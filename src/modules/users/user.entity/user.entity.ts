import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Chat } from '../chats/chat.entity';
import { Message } from '../chats/message.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastSeen: Date;

  @ManyToMany(() => Chat, chat => chat.participants)
  chats: Chat[];

  @OneToMany(() => Message, message => message.author)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}