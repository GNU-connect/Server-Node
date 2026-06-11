import { Injectable } from '@nestjs/common';
import {
  NoticeCategoryResult,
  NoticeListResult,
} from 'src/api/public/notices/application/dtos/results/notice-list-result.dto';
import { NoticeCategoriesRepository } from 'src/api/public/notices/infrastructure/notice-categories.repository';
import { NoticeCategory } from 'src/api/public/notices/domain/entities/notice-category.entity';
import { Notice } from 'src/api/public/notices/domain/entities/notice.entity';
import { NoticesRepository } from 'src/api/public/notices/infrastructure/notices.repository';
import { User } from 'src/api/public/users/domain/entities/users.entity';

@Injectable()
export class NoticesService {
  private readonly UNIVERSITY_DEPARTMENT_ID = 117;

  private readonly TARGET_CATEGORIES = ['기관', '채용', '장학', '외부기관 행사', '학사'];

  private readonly CAROUSEL_ITEMS_LIMIT = 4;

  constructor(
    private readonly noticesRepository: NoticesRepository,
    private readonly noticeCategoriesRepository: NoticeCategoriesRepository,
  ) {}

  /**
   * 학교 공지사항 조회
   * @returns 카테고리별 공지사항 Map (데이터가 없으면 빈 Map)
   */
  async getUniversityNotices(): Promise<NoticeListResult> {
    const categories = await this.noticeCategoriesRepository.findByDepartmentIdAndCategories(
      this.UNIVERSITY_DEPARTMENT_ID,
      this.TARGET_CATEGORIES,
    );

    if (categories.length === 0) {
      return { categories: [] };
    }

    const categoryIds = categories.map(category => category.id);
    const noticesByCategory = await this.noticesRepository.findRecentByCategoryIds(
      categoryIds,
      this.CAROUSEL_ITEMS_LIMIT,
    );

    const categoriesResult: NoticeCategoryResult[] = [];

    for (const targetCategory of this.TARGET_CATEGORIES) {
      const category = categories.find(c => c.category === targetCategory);
      if (category) {
        const notices = noticesByCategory.get(category.id) || [];
        if (notices.length > 0) {
          categoriesResult.push(this.createNoticeCategoryResult(category, notices));
        }
      }
    }

    return { categories: categoriesResult };
  }

  /**
   * 학과 공지사항 조회
   * @param user 현재 사용자 (department 미설정 시 빈 Map 반환)
   * @returns 카테고리별 공지사항 Map
   */
  async getDepartmentNotices(user: User): Promise<NoticeListResult> {
    if (!user.department) {
      return { categories: [] };
    }

    const departmentIds: number[] = [user.department.id];
    if (user.department.parentDepartmentId) {
      departmentIds.push(user.department.parentDepartmentId);
    }

    const categories = await this.noticeCategoriesRepository.findByDepartmentIds(departmentIds);

    if (categories.length === 0) {
      return { categories: [] };
    }

    const categoryIds = categories.map(category => category.id);
    const noticesByCategory = await this.noticesRepository.findRecentByCategoryIds(
      categoryIds,
      this.CAROUSEL_ITEMS_LIMIT,
    );

    const categoriesResult: NoticeCategoryResult[] = [];

    for (const category of categories) {
      const notices = noticesByCategory.get(category.id) || [];
      if (notices.length > 0) {
        categoriesResult.push(this.createNoticeCategoryResult(category, notices));
      }
    }

    return { categories: categoriesResult };
  }

  private createNoticeCategoryResult(
    category: NoticeCategory,
    notices: Notice[],
  ): NoticeCategoryResult {
    return {
      category: category.category,
      mi: category.mi,
      bbsId: category.bbsId,
      departmentName: category.department?.name,
      departmentEn: category.department?.departmentEn,
      notices: notices.map(notice => ({
        title: notice.title,
        nttSn: notice.nttSn,
        createdAt: notice.createdAt,
      })),
    };
  }
}
