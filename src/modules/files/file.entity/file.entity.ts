import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity/user.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @Column()
  path: string; // Путь на диске или URL в облаке

  @CreateDateColumn()
  uploadDate: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column()
  uploadedById: number;

  @Column({ nullable: true })
  chatId?: number; // Если файл привязан к чату

  @Column({ nullable: true })
  messageId?: number; // Если файл привязан к сообщению

  @Column({ default: false })
  isDeleted: boolean;
}
