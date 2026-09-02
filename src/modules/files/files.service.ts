import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './file.entity/file.entity';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(
    file: Express.Multer.File,
    userId: number,
    chatId?: number,
    messageId?: number,
  ): Promise<File> {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    const fileExt = path.extname(file.originalname);
    const uniqueFilename = `${randomUUID()}${fileExt}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    await fs.promises.writeFile(filePath, file.buffer);

    const fileRecord = this.fileRepository.create({
      filename: uniqueFilename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
      uploadedById: userId,
      chatId,
      messageId,
      isDeleted: false,
    });

    return this.fileRepository.save(fileRecord);
  }

  async getFile(fileId: number, userId: number): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, uploadedById: userId, isDeleted: false },
      relations: { uploadedBy: true },
    });

    if (!file) {
      throw new NotFoundException('Файл не найден');
    }

    return file;
  }

  async deleteFile(fileId: number, userId: number): Promise<void> {
    const file = await this.getFile(fileId, userId);

    await this.fileRepository.update(file.id, { isDeleted: true });
  }

  async getUserFiles(userId: number): Promise<File[]> {
    return this.fileRepository.find({
      where: { uploadedById: userId, isDeleted: false },
      order: { uploadDate: 'DESC' },
    });
  }

  async getChatFiles(chatId: number, userId: number): Promise<File[]> {
    return this.fileRepository.find({
      where: { chatId, isDeleted: false },
      order: { uploadDate: 'DESC' },
    });
  }
}
