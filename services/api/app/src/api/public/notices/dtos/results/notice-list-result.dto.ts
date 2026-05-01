import { NoticeCategory } from 'src/type-orm/entities/notices/notice-category.entity';
import { Notice } from 'src/type-orm/entities/notices/notice.entity';

export interface NoticeListResult {
  noticesMap: Map<NoticeCategory, Notice[]>;
}
