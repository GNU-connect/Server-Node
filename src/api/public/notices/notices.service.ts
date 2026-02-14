import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { NoticeMessagesService } from 'src/api/public/message-templates/notice-messages.service';
import { NoticeCategoriesRepository } from 'src/type-orm/entities/notices/notice-categories.repository';
import { NoticeCategory } from 'src/type-orm/entities/notices/notice-category.entity';
import { Notice } from 'src/type-orm/entities/notices/notice.entity';
import { NoticesRepository } from 'src/type-orm/entities/notices/notices.repository';
import { CommonMessagesService } from '../message-templates/common-messages.service';

@Injectable()
export class NoticesService {
  // 학교 공지사항 department_id
  private readonly UNIVERSITY_DEPARTMENT_ID = 117;

  // 조회할 카테고리 목록
  private readonly TARGET_CATEGORIES = [
    '기관',
    '채용',
    '장학',
    '외부기관 행사',
    '학사',
  ];

  // 캐러셀형 ListCard의 최대 아이템 수
  private readonly CAROUSEL_ITEMS_LIMIT = 4;

  constructor(
    private readonly noticesRepository: NoticesRepository,
    private readonly noticeCategoriesRepository: NoticeCategoriesRepository,
    private readonly noticeMessagesService: NoticeMessagesService,
    private readonly commonMessagesService: CommonMessagesService,
  ) {}

  /**
   * 학교 공지사항 템플릿 생성
   * @returns SkillTemplate (캐러셀 형태의 5개 ListCard)
   */
  async getUniversityNoticeTemplate(): Promise<SkillTemplate> {
    // 1. 학교 공지 카테고리 조회
    const categories =
      await this.noticeCategoriesRepository.findByDepartmentIdAndCategories(
        this.UNIVERSITY_DEPARTMENT_ID,
        this.TARGET_CATEGORIES,
      );

    if (categories.length === 0) {
      return this.commonMessagesService.createSimpleText(
        '학교 공지사항 카테고리를 찾을 수 없습니다.',
      );
    }

    // 2. 각 카테고리별 최신 공지 조회
    const categoryIds = categories.map((category) => category.id);
    const noticesByCategory = await this.noticesRepository.findRecentByCategoryIds(
      categoryIds,
      this.CAROUSEL_ITEMS_LIMIT,
    );

    // 3. 카테고리와 공지사항을 매핑
    const noticesByCategoryEntity = new Map<NoticeCategory, Notice[]>();
    
    // TARGET_CATEGORIES 순서대로 정렬
    for (const targetCategory of this.TARGET_CATEGORIES) {
      const category = categories.find((c) => c.category === targetCategory);
      if (category) {
        const notices = noticesByCategory.get(category.id) || [];
        if (notices.length > 0) {
          noticesByCategoryEntity.set(category, notices);
        }
      }
    }

    if (noticesByCategoryEntity.size === 0) {
      return this.commonMessagesService.createSimpleText(
        '현재 등록된 공지사항이 없습니다.',
      );
    }

    // 4. 캐러셀 응답 생성
    return this.noticeMessagesService.createUniversityNoticeCarousel(
      noticesByCategoryEntity,
    );
  }
}
