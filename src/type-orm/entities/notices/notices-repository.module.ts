import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeCategoriesRepository } from 'src/type-orm/entities/notices/notice-categories.repository';
import { NoticeCategory } from 'src/type-orm/entities/notices/notice-category.entity';
import { Notice } from 'src/type-orm/entities/notices/notice.entity';
import { NoticesRepository } from 'src/type-orm/entities/notices/notices.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Notice, NoticeCategory])],
  providers: [NoticesRepository, NoticeCategoriesRepository],
  exports: [NoticesRepository, NoticeCategoriesRepository],
})
export class NoticesRepositoryModule {}
