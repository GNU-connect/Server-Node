import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonMessageFactory } from 'src/api/public/common/presentation/common-message.factory';
import { NoticeCategory } from 'src/api/public/notices/domain/entities/notice-category.entity';
import { Notice } from 'src/api/public/notices/domain/entities/notice.entity';
import { NoticeCategoriesRepository } from 'src/api/public/notices/infrastructure/notice-categories.repository';
import { NoticeMessageFactory } from 'src/api/public/notices/presentation/notice-message.factory';
import { NoticesRepository } from 'src/api/public/notices/infrastructure/notices.repository';
import { NoticesController } from 'src/api/public/notices/presentation/notices.controller';
import { NoticesService } from 'src/api/public/notices/application/notices.service';

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
