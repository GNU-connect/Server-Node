import { Module } from '@nestjs/common';
import { CommonMessageFactory } from 'src/api/public/common/common-message.factory';
import { NoticeMessageFactory } from 'src/api/public/notices/notice-message.factory';
import { NoticesRepositoryModule } from 'src/type-orm/entities/notices/notices-repository.module';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';

@Module({
  imports: [NoticesRepositoryModule],
  controllers: [NoticesController],
  providers: [NoticesService, NoticeMessageFactory, CommonMessageFactory],
  exports: [NoticesService],
})
export class NoticesModule {}
