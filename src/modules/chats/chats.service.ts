import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChatType } from './chat.entity';
import { Message } from './message.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createPrivateChat(userId: number, targetUserId: number): Promise<Chat> {
    if (userId === targetUserId) {
      throw new ForbiddenException('Cannot create chat with yourself');
    }

    const [user, targetUser] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.userRepository.findOne({ where: { id: targetUserId } })
    ]);

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingChat = await this.chatRepository
      .createQueryBuilder('chat')
      .innerJoin('chat.participants', 'user1', 'user1.id = :userId', { userId })
      .innerJoin('chat.participants', 'user2', 'user2.id = :targetUserId', { targetUserId })
      .where('chat.type = :type', { type: ChatType.PRIVATE })
      .getOne();

    if (existingChat) {
      return existingChat;
    }

    const chat = this.chatRepository.create({
      type: ChatType.PRIVATE,
      participants: [user, targetUser],
    });

    return this.chatRepository.save(chat);
  }

  async createGroupChat(creatorId: number, name: string, participantIds: number[]): Promise<Chat> {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    const participants = await this.userRepository.findByIds(participantIds);
    participants.push(creator);

    const chat = this.chatRepository.create({
      type: ChatType.GROUP,
      name,
      participants,
    });

    return this.chatRepository.save(chat);
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participants')
      .leftJoinAndSelect('chat.messages', 'messages')
      .leftJoinAndSelect('messages.author', 'author')
      .where('participants.id = :userId', { userId })
      .orderBy('messages.createdAt', 'DESC')
      .getMany();
  }

  async getChat(chatId: number, userId: number): Promise<Chat> {
    const chat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participants')
      .leftJoinAndSelect('chat.messages', 'messages')
      .leftJoinAndSelect('messages.author', 'author')
      .where('chat.id = :chatId', { chatId })
      .andWhere('participants.id = :userId', { userId })
      .getOne();

    if (!chat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    return chat;
  }

  async getChatMessages(chatId: number, userId: number, page: number = 1, limit: number = 50): Promise<Message[]> {
    const chat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participants')
      .where('chat.id = :chatId', { chatId })
      .andWhere('participants.id = :userId', { userId })
      .getOne();

    if (!chat) {
      throw new ForbiddenException('Access denied to this chat');
    }

    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.author', 'author')
      .where('message.chat.id = :chatId', { chatId })
      .orderBy('message.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async sendMessage(chatId: number, userId: number, content: string): Promise<Message> {
    const chat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participants')
      .where('chat.id = :chatId', { chatId })
      .andWhere('participants.id = :userId', { userId })
      .getOne();

    if (!chat) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    const author = await this.userRepository.findOne({ where: { id: userId } });
    
    const message = this.messageRepository.create({
      content,
      author,
      chat,
    });

    return this.messageRepository.save(message);
  }

  async addParticipant(chatId: number, adminId: number, userId: number): Promise<Chat> {
    const chat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participants')
      .where('chat.id = :chatId', { chatId })
      .getOne();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const isAdminParticipant = chat.participants.some(p => p.id === adminId);
    if (!isAdminParticipant) {
      throw new ForbiddenException('Only chat participants can add members');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAlreadyParticipant = chat.participants.some(p => p.id === userId);
    if (!isAlreadyParticipant) {
      chat.participants.push(user);
      return this.chatRepository.save(chat);
    }

    return chat;
  }

  async removeParticipant(chatId: number, adminId: number, targetUserId: number): Promise<Chat> {
    const chat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participants')
      .where('chat.id = :chatId', { chatId })
      .getOne();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const isAdminParticipant = chat.participants.some(p => p.id === adminId);
    if (!isAdminParticipant) {
      throw new ForbiddenException('Only chat participants can remove members');
    }

    chat.participants = chat.participants.filter(p => p.id !== targetUserId);
    return this.chatRepository.save(chat);
  }
}