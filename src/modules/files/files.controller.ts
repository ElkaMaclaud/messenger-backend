import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Request,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import * as fs from 'fs';

interface AuthenticatedRequest extends Express.Request {
  user: {
    id: number;
    username: string;
  };
}

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
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
    @Param('chatId') chatId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.filesService.getChatFiles(chatId, req.user.id);
  }

  @Get(':id')
  @Header('Content-Type', 'application/octet-stream')
  async getFile(
    @Param('id') fileId: number,
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
    @Param('id') fileId: number,
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
    @Param('id') fileId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.filesService.deleteFile(fileId, req.user.id);
    return { message: 'Файл удален' };
  }
}
