import { Injectable } from '@nestjs/common';
import { Carousel, ListCard } from 'src/api/common/interfaces/response/fields/component';
import { ListItem } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { NoticeCategory } from 'src/type-orm/entities/notices/notice-category.entity';
import { Notice } from 'src/type-orm/entities/notices/notice.entity';

@Injectable()
export class NoticeMessagesService {
  /**
   * 학교 공지사항 캐러셀 생성
   * @param noticesByCategory 카테고리별 공지사항 Map
   * @returns SkillTemplate (캐러셀 형태의 여러 ListCard)
   */
  createUniversityNoticeCarousel(
    noticesByCategory: Map<NoticeCategory, Notice[]>,
  ): SkillTemplate {
    const carouselItems: ListCard['listCard'][] = [];

    for (const [category, notices] of noticesByCategory) {
      const header: ListItem = {
        title: `${category.category} 공지`,
      };

      const items: ListItem[] = notices.map((notice) => ({
        title: notice.title,
        description: this.formatNoticeDate(notice.createdAt),
        link: {
          web: this.createNoticeLinkUrl(
            category.mi,
            category.bbsId,
            notice.nttSn,
          ),
        },
      }));

      carouselItems.push({
        header,
        items,
      });
    }

    const carousel: Carousel = {
      carousel: {
        type: 'listCard',
        items: carouselItems,
      },
    };

    return {
      outputs: [carousel],
    };
  }

  /**
   * 학과 공지사항 캐러셀 생성
   * @param noticesByCategory 카테고리별 공지사항 Map (department relation 포함)
   * @returns SkillTemplate (캐러셀 형태의 여러 ListCard)
   */
  createDepartmentNoticeCarousel(
    noticesByCategory: Map<NoticeCategory, Notice[]>,
  ): SkillTemplate {
    const carouselItems: ListCard['listCard'][] = [];

    for (const [category, notices] of noticesByCategory) {
      const header: ListItem = {
        title: `${category.department.name} - ${category.category}`,
      };

      const items: ListItem[] = notices.map((notice) => ({
        title: notice.title,
        description: this.formatNoticeDate(notice.createdAt),
        link: {
          web: this.createDepartmentNoticeLinkUrl(
            category.department.departmentEn,
            category.mi,
            category.bbsId,
            notice.nttSn,
          ),
        },
      }));

      const buttons = [
        {
          label: '더보기',
          action: 'webLink' as const,
          webLinkUrl: this.createNoticeBoardListUrl(
            category.department.departmentEn,
            category.mi,
            category.bbsId,
          ),
        },
      ];

      carouselItems.push({
        header,
        items,
        buttons,
      });
    }

    const carousel: Carousel = {
      carousel: {
        type: 'listCard',
        items: carouselItems,
      },
    };

    return {
      outputs: [carousel],
    };
  }

  /**
   * 공지사항 URL 생성 (학교용)
   * @param mi notice_category.mi
   * @param bbsId notice_category.bbs_id
   * @param nttSn notice.ntt_sn
   * @returns 공지사항 URL
   */
  private createNoticeLinkUrl(mi: number, bbsId: number, nttSn: number): string {
    return `https://www.gnu.ac.kr/main/na/ntt/selectNttInfo.do?mi=${mi}&bbsId=${bbsId}&nttSn=${nttSn}`;
  }

  /**
   * 공지사항 URL 생성 (학과용)
   * @param departmentEn department.department_en
   * @param mi notice_category.mi
   * @param bbsId notice_category.bbs_id
   * @param nttSn notice.ntt_sn
   * @returns 공지사항 URL
   */
  private createDepartmentNoticeLinkUrl(
    departmentEn: string,
    mi: number,
    bbsId: number,
    nttSn: number,
  ): string {
    return `https://www.gnu.ac.kr/${departmentEn}/na/ntt/selectNttInfo.do?mi=${mi}&bbsId=${bbsId}&nttSn=${nttSn}`;
  }

  /**
   * 공지사항 게시판 목록 URL 생성
   * @param departmentEn department.department_en
   * @param mi notice_category.mi
   * @param bbsId notice_category.bbs_id
   * @returns 공지사항 게시판 목록 URL
   */
  private createNoticeBoardListUrl(
    departmentEn: string,
    mi: number,
    bbsId: number,
  ): string {
    return `https://www.gnu.ac.kr/${departmentEn}/na/ntt/selectNttList.do?mi=${mi}&bbsId=${bbsId}`;
  }

  /**
   * 날짜 포맷팅 (YYYY-MM-DD)
   * @param date Date 객체 또는 문자열
   * @returns 포맷팅된 날짜 문자열
   */
  private formatNoticeDate(date: Date): string {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
