import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from '../../users/user.entity/user.entity';

@Entity()
export class File {
  @PrimaryKey()
  id: number;

  @Property()
  filename: string;

  @Property()
  originalName: string;

  @Property()
  mimetype: string;

  @Property()
  size: number;

  @Property()
  path: string; // Путь на диске или URL в облаке

  @Property()
  uploadDate: Date = new Date();

  @ManyToOne(() => User)
  uploadedBy: User;

  @Property({ nullable: true })
  chatId?: number; // Если файл привязан к чату

  @Property({ nullable: true })
  messageId?: number; // Если файл привязан к сообщению

  @Property({ default: false })
  isDeleted: boolean = false;
}
