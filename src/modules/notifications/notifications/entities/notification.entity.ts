import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../../users/user.entity/user.entity';

export type NotificationType = 'message' | 'call' | 'system' | 'friend_request';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Column({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'varchar' })
  type: NotificationType;

  @Column({ nullable: true })
  relatedId?: number; // ID сообщения, звонка и т.д.

  @CreateDateColumn()
  createdAt: Date;
}
