import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NoticeCategory } from './domain/notice-category.entity';
import { Notice } from './domain/notice.entity';
import type { ParsedNotice } from './type/parsed-notice';

@Injectable()
export class NoticeRepository {
  constructor(
    @InjectRepository(NoticeCategory)
    private readonly categoryRepository: Repository<NoticeCategory>,
    private readonly dataSource: DataSource,
  ) {}

  findCategoriesByDepartmentId(
    departmentId: number,
  ): Promise<NoticeCategory[]> {
    return this.categoryRepository.find({
      where: { departmentId },
      order: { id: 'ASC' },
    });
  }

  findCategoryById(id: number): Promise<NoticeCategory | null> {
    return this.categoryRepository.findOne({ where: { id } });
  }

  /**
   * 새 공지를 누적 저장하고 카테고리의 last_ntt_sn을 올린다.
   * (category_id, ntt_sn) 유니크 인덱스 덕분에 재실행해도 중복이 생기지 않는다.
   */
  async saveNew(categoryId: number, notices: ParsedNotice[]): Promise<void> {
    if (notices.length === 0) return;

    const lastNttSn = Math.max(...notices.map((notice) => notice.nttSn));

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(Notice)
        .values(
          notices.map(({ nttSn, title, createdAt }) => ({
            categoryId,
            nttSn,
            title,
            createdAt,
          })),
        )
        .orIgnore()
        .execute();

      await manager.query(
        `UPDATE notice_category
         SET last_ntt_sn = GREATEST(last_ntt_sn, $2), updated_at = now()
         WHERE id = $1`,
        [categoryId, lastNttSn],
      );
    });
  }
}
