import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Request,
  StreamableFile,
  Header,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';
import { ChatsService } from '../chats/chats.service';
import { UploadFileDto } from './dto/upload-file.dto';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import * as fs from 'fs';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/ogg', 'audio/webm',
  'application/pdf',
  'text/plain',
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly chatsService: ChatsService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Тип файла не разрешён: ${file.mimetype}`), false);
      }
    },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.filesService.saveFile(
      file,
      req.user.id,
      dto.chatId,
      dto.messageId,
    );
  }

  @Get('user')
  async getUserFiles(@Request() req: AuthenticatedRequest) {
    return this.filesService.getUserFiles(req.user.id);
  }

  @Get('chat/:chatId')
  async getChatFiles(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.chatsService.getChat(chatId, req.user.id); // проверяет членство, бросает 404/403 если нет
    return this.filesService.getChatFiles(chatId, req.user.id);
  }

  @Get(':id')
  @Header('Content-Type', 'application/octet-stream')
  async getFile(
    @Param('id', ParseIntPipe) fileId: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const file = await this.filesService.getFile(fileId, req.user.id);

    const fileStream = fs.createReadStream(file.path);
    return new StreamableFile(fileStream, {
      disposition: `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      type: file.mimetype,
    });
  }

  @Get(':id/info')
  async getFileInfo(
    @Param('id', ParseIntPipe) fileId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    const file = await this.filesService.getFile(fileId, req.user.id);

    return {
      id: file.id,
      filename: file.originalName,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: file.uploadDate,
      uploadedBy: file.uploadedBy.username,
    };
  }

  @Delete(':id')
  async deleteFile(
    @Param('id', ParseIntPipe) fileId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.filesService.deleteFile(fileId, req.user.id);
    return { message: 'Файл удален' };
  }
}
