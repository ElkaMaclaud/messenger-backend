import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from '../../../users/user.entity/user.entity';

@Entity()
export class Notification {
  @PrimaryKey()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Property()
  title: string;

  @Property({ type: 'text' })
  body: string;

  @Property({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @Property({ default: false })
  isRead: boolean = false;

  @Property()
  type: 'message' | 'call' | 'system' | 'friend_request';

  @Property({ nullable: true })
  relatedId?: number; // ID сообщения, звонка и т.д.

  @Property()
  createdAt: Date = new Date();
}
