import { Module } from '@nestjs/common';
import { CommonMessagesService } from 'src/api/public/message-templates/common-messages.service';
import { NoticeMessagesService } from 'src/api/public/message-templates/notice-messages.service';
import { NoticesRepositoryModule } from 'src/type-orm/entities/notices/notices-repository.module';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';

@Module({
  imports: [NoticesRepositoryModule],
  controllers: [NoticesController],
  providers: [NoticesService, NoticeMessagesService, CommonMessagesService],
  exports: [NoticesService],
})
export class NoticesModule {}
