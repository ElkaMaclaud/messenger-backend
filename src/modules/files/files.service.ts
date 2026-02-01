import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { File } from './file.entity/file.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(File)
    private fileRepository: EntityRepository<File>,
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
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    fs.writeFileSync(filePath, file.buffer);

    const fileRecord = this.fileRepository.create({
      filename: uniqueFilename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
      uploadedBy: userId as any,
      chatId,
      messageId,
    });

    await this.fileRepository.persistAndFlush(fileRecord);
    return fileRecord;
  }

  async getFile(fileId: number, userId: number): Promise<File> {
    const file = await this.fileRepository.findOne(
      { id: fileId, isDeleted: false },
      { populate: ['uploadedBy'] },
    );

    if (!file) {
      throw new NotFoundException('Файл не найден');
    }

    if (file.uploadedBy.id !== userId) {
      throw new NotFoundException('Файл не найден');
    }

    return file;
  }

  async deleteFile(fileId: number, userId: number): Promise<void> {
    const file = await this.getFile(fileId, userId);

    file.isDeleted = true;
    await this.fileRepository.persistAndFlush(file);
  }

  async getUserFiles(userId: number): Promise<File[]> {
    return this.fileRepository.find(
      { uploadedBy: userId, isDeleted: false },
      { orderBy: { uploadDate: 'DESC' } },
    );
  }

  async getChatFiles(chatId: number, userId: number): Promise<File[]> {
    return this.fileRepository.find(
      { chatId, isDeleted: false },
      { orderBy: { uploadDate: 'DESC' } },
    );
  }
}
