import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notice } from 'src/type-orm/entities/notices/notice.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NoticesRepository {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  /**
   * 특정 카테고리의 최신 공지사항 조회
   * @param categoryId 카테고리 ID
   * @param limit 조회 개수
   * @returns 공지사항 목록
   */
  findRecentByCategoryId(categoryId: number, limit: number): Promise<Notice[]> {
    return this.noticeRepository
      .createQueryBuilder('notice')
      .where('notice.category_id = :categoryId', { categoryId })
      .orderBy('notice.created_at', 'DESC')
      .addOrderBy('notice.ntt_sn', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * 여러 카테고리의 최신 공지사항을 한 번에 조회
   * @param categoryIds 카테고리 ID 배열
   * @param limit 각 카테고리당 조회 개수
   * @returns 공지사항 목록
   */
  async findRecentByCategoryIds(
    categoryIds: number[],
    limit: number,
  ): Promise<Map<number, Notice[]>> {
    const notices = await this.noticeRepository
      .createQueryBuilder('notice')
      .where('notice.category_id IN (:...categoryIds)', { categoryIds })
      .orderBy('notice.category_id', 'ASC')
      .addOrderBy('notice.created_at', 'DESC')
      .addOrderBy('notice.ntt_sn', 'DESC')
      .getMany();

    // 카테고리별로 그룹화하고 limit 적용
    const noticesByCategory = new Map<number, Notice[]>();
    for (const notice of notices) {
      if (!noticesByCategory.has(notice.categoryId)) {
        noticesByCategory.set(notice.categoryId, []);
      }
      const categoryNotices = noticesByCategory.get(notice.categoryId)!;
      if (categoryNotices.length < limit) {
        categoryNotices.push(notice);
      }
    }

    return noticesByCategory;
  }
}
