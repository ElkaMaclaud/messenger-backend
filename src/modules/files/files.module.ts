import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { File } from './file.entity/file.entity';
import { ChatsModule } from '../chats/chats.module';

@Module({
  imports: [MikroOrmModule.forFeature([File]), ChatsModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
