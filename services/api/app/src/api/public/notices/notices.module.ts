import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonMessageFactory } from 'src/api/public/common/common-message.factory';
import { NoticeCategory } from 'src/api/public/notices/entities/notice-category.entity';
import { Notice } from 'src/api/public/notices/entities/notice.entity';
import { NoticeCategoriesRepository } from 'src/api/public/notices/notice-categories.repository';
import { NoticeMessageFactory } from 'src/api/public/notices/notice-message.factory';
import { NoticesRepository } from 'src/api/public/notices/notices.repository';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notice, NoticeCategory])],
  controllers: [NoticesController],
  providers: [
    NoticesService,
    NoticesRepository,
    NoticeCategoriesRepository,
    NoticeMessageFactory,
    CommonMessageFactory,
  ],
  exports: [NoticesService],
})
export class NoticesModule {}
