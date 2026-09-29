import { Injectable } from '@nestjs/common';
import { BatchJob } from '../batch-job.interface';
import { NoticeClient } from './notice.client';
import { NoticeParser } from './notice.parser';
import { NoticeRepository } from './notice.repository';

/** notice_category.department_id 중 학교 공지(학과 공지가 아닌 것) */
const UNIVERSITY_DEPARTMENT_ID = 117;

@Injectable()
export class UniversityNoticeJob implements BatchJob {
  readonly name = 'university-notice';

  constructor(
    private readonly client: NoticeClient,
    private readonly parser: NoticeParser,
    private readonly repository: NoticeRepository,
  ) {}

  /** 게시판(카테고리)마다 scrape_run을 남기기 위해 카테고리 id를 대상으로 돌려준다. */
  async targets(): Promise<string[]> {
    const categories = await this.repository.findCategoriesByDepartmentId(
      UNIVERSITY_DEPARTMENT_ID,
    );
    return categories.map((category) => String(category.id));
  }

  async run(target?: string): Promise<void> {
    if (target === undefined) {
      throw new Error(
        'university-notice 수집에는 target(카테고리 id)이 필요합니다.',
      );
    }

    const categoryId = Number(target);
    if (!Number.isInteger(categoryId)) {
      throw new Error(`올바르지 않은 카테고리 id입니다: ${target}`);
    }

    const category = await this.repository.findCategoryById(categoryId);
    if (!category) {
      throw new Error(`공지 카테고리를 찾을 수 없습니다: ${target}`);
    }
    if (category.departmentId !== UNIVERSITY_DEPARTMENT_ID) {
      throw new Error(`학교 공지 카테고리가 아닙니다: ${target}`);
    }

    const raw = await this.client.fetch(category);
    const newNotices = this.parser
      .parse(raw)
      .filter((notice) => notice.nttSn > category.lastNttSn)
      .sort((a, b) => a.nttSn - b.nttSn);

    if (newNotices.length === 0) return;

    await this.repository.saveNew(category.id, newNotices);
  }
}
