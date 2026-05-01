import { Injectable } from '@nestjs/common';
import { Carousel, ListCard } from 'src/api/common/interfaces/response/fields/component';
import { ListItem } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import {
  NoticeCategoryResult,
  NoticeListResult,
} from 'src/api/public/notices/dtos/results/notice-list-result.dto';

@Injectable()
export class NoticeMessageFactory {
  /**
   * 학교 공지사항 캐러셀 생성
   * @param result 카테고리별 공지사항 목록
   * @returns SkillTemplate (캐러셀 형태의 여러 ListCard)
   */
  createUniversityNoticeCarousel(result: NoticeListResult): SkillTemplate {
    const carouselItems: ListCard['listCard'][] = [];

    for (const category of result.categories) {
      const header: ListItem = {
        title: `${category.category} 공지`,
      };

      const items: ListItem[] = category.notices.map(notice => ({
        title: notice.title,
        description: this.formatNoticeDate(notice.createdAt),
        link: {
          web: this.createNoticeLinkUrl(category.mi, category.bbsId, notice.nttSn),
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
   * @param result 카테고리별 공지사항 목록
   * @returns SkillTemplate (캐러셀 형태의 여러 ListCard)
   */
  createDepartmentNoticeCarousel(result: NoticeListResult): SkillTemplate {
    const carouselItems: ListCard['listCard'][] = [];

    for (const category of result.categories) {
      const departmentName = this.requireDepartmentField(category, 'departmentName');
      const departmentEn = this.requireDepartmentField(category, 'departmentEn');
      const header: ListItem = {
        title: `${departmentName} - ${category.category}`,
      };

      const items: ListItem[] = category.notices.map(notice => ({
        title: notice.title,
        description: this.formatNoticeDate(notice.createdAt),
        link: {
          web: this.createDepartmentNoticeLinkUrl(
            departmentEn,
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
          webLinkUrl: this.createNoticeBoardListUrl(departmentEn, category.mi, category.bbsId),
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
  private createNoticeBoardListUrl(departmentEn: string, mi: number, bbsId: number): string {
    return `https://www.gnu.ac.kr/${departmentEn}/na/ntt/selectNttList.do?mi=${mi}&bbsId=${bbsId}`;
  }

  private requireDepartmentField(
    category: NoticeCategoryResult,
    field: 'departmentName' | 'departmentEn',
  ): string {
    const value = category[field];
    if (!value) {
      throw new Error(`학과 공지사항 카테고리에 ${field} 값이 없습니다.`);
    }
    return value;
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
