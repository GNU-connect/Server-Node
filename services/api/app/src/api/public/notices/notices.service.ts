import { Injectable } from '@nestjs/common';
import { NoticeCategoriesRepository } from 'src/type-orm/entities/notices/notice-categories.repository';
import { NoticeCategory } from 'src/type-orm/entities/notices/notice-category.entity';
import { Notice } from 'src/type-orm/entities/notices/notice.entity';
import { NoticesRepository } from 'src/type-orm/entities/notices/notices.repository';
import { User } from 'src/type-orm/entities/users/users.entity';

@Injectable()
export class NoticesService {
  private readonly UNIVERSITY_DEPARTMENT_ID = 117;

  private readonly TARGET_CATEGORIES = [
    '기관',
    '채용',
    '장학',
    '외부기관 행사',
    '학사',
  ];

  private readonly CAROUSEL_ITEMS_LIMIT = 4;

  constructor(
    private readonly noticesRepository: NoticesRepository,
    private readonly noticeCategoriesRepository: NoticeCategoriesRepository,
  ) {}

  /**
   * 학교 공지사항 조회
   * @returns 카테고리별 공지사항 Map (데이터가 없으면 빈 Map)
   */
  async getUniversityNotices(): Promise<Map<NoticeCategory, Notice[]>> {
    const categories =
      await this.noticeCategoriesRepository.findByDepartmentIdAndCategories(
        this.UNIVERSITY_DEPARTMENT_ID,
        this.TARGET_CATEGORIES,
      );

    if (categories.length === 0) {
      return new Map();
    }

    const categoryIds = categories.map((category) => category.id);
    const noticesByCategory = await this.noticesRepository.findRecentByCategoryIds(
      categoryIds,
      this.CAROUSEL_ITEMS_LIMIT,
    );

    const result = new Map<NoticeCategory, Notice[]>();

    for (const targetCategory of this.TARGET_CATEGORIES) {
      const category = categories.find((c) => c.category === targetCategory);
      if (category) {
        const notices = noticesByCategory.get(category.id) || [];
        if (notices.length > 0) {
          result.set(category, notices);
        }
      }
    }

    return result;
  }

  /**
   * 학과 공지사항 조회
   * @param user 현재 사용자 (department 미설정 시 빈 Map 반환)
   * @returns 카테고리별 공지사항 Map
   */
  async getDepartmentNotices(user: User): Promise<Map<NoticeCategory, Notice[]>> {
    if (!user.department) {
      return new Map();
    }

    const departmentIds: number[] = [user.department.id];
    if (user.department.parentDepartmentId) {
      departmentIds.push(user.department.parentDepartmentId);
    }

    const categories = await this.noticeCategoriesRepository.findByDepartmentIds(
      departmentIds,
    );

    if (categories.length === 0) {
      return new Map();
    }

    const categoryIds = categories.map((category) => category.id);
    const noticesByCategory = await this.noticesRepository.findRecentByCategoryIds(
      categoryIds,
      this.CAROUSEL_ITEMS_LIMIT,
    );

    const result = new Map<NoticeCategory, Notice[]>();

    for (const category of categories) {
      const notices = noticesByCategory.get(category.id) || [];
      if (notices.length > 0) {
        result.set(category, notices);
      }
    }

    return result;
  }
}
