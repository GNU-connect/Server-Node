import { Test, TestingModule } from '@nestjs/testing';
import { NoticeMessageFactory } from 'src/api/public/notices/notice-message.factory';
import {
  NoticeCategoryResult,
  NoticeItemResult,
  NoticeListResult,
} from 'src/api/public/notices/dtos/results/notice-list-result.dto';

const makeCategory = (overrides: Partial<NoticeCategoryResult> = {}): NoticeCategoryResult => ({
  category: '학사',
  mi: 100,
  bbsId: 200,
  departmentName: '컴퓨터공학부',
  departmentEn: 'cse',
  notices: [],
  ...overrides,
});

const makeNotice = (overrides: Partial<NoticeItemResult> = {}): NoticeItemResult => ({
  title: '2024학년도 수강신청 안내',
  nttSn: 12345,
  createdAt: new Date('2024-06-01'),
  ...overrides,
});

const makeResult = (categories: NoticeCategoryResult[]): NoticeListResult => ({ categories });

describe('NoticeMessageFactory', () => {
  let service: NoticeMessageFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoticeMessageFactory],
    }).compile();

    service = module.get<NoticeMessageFactory>(NoticeMessageFactory);
  });

  describe('createUniversityNoticeCarousel', () => {
    it('캐러셀 타입의 SkillTemplate을 반환한다', () => {
      const category = makeCategory();
      const notice = makeNotice();
      const noticeResult = makeResult([{ ...category, notices: [notice] }]);

      const result = service.createUniversityNoticeCarousel(noticeResult);

      expect(result.outputs).toHaveLength(1);
      expect(result.outputs[0]).toHaveProperty('carousel');
      expect((result.outputs[0] as any).carousel.type).toBe('listCard');
    });

    it('카테고리마다 ListCard 하나씩 생성한다', () => {
      const cat1 = makeCategory({ category: '학사', notices: [makeNotice()] });
      const cat2 = makeCategory({ category: '장학', notices: [makeNotice()] });

      const result = service.createUniversityNoticeCarousel(makeResult([cat1, cat2]));
      const items = (result.outputs[0] as any).carousel.items;

      expect(items).toHaveLength(2);
    });

    it('카드 헤더 타이틀이 "${category} 공지" 형식이다', () => {
      const category = makeCategory({ category: '학사' });

      const result = service.createUniversityNoticeCarousel(
        makeResult([{ ...category, notices: [makeNotice()] }]),
      );
      const header = (result.outputs[0] as any).carousel.items[0].header;

      expect(header.title).toBe('학사 공지');
    });

    it('공지 항목의 링크 URL이 학교 공지 URL 형식을 따른다', () => {
      const category = makeCategory({ mi: 100, bbsId: 200 });
      const notice = makeNotice({ nttSn: 12345 });

      const result = service.createUniversityNoticeCarousel(
        makeResult([{ ...category, notices: [notice] }]),
      );
      const item = (result.outputs[0] as any).carousel.items[0].items[0];

      expect(item.link.web).toBe(
        'https://www.gnu.ac.kr/main/na/ntt/selectNttInfo.do?mi=100&bbsId=200&nttSn=12345',
      );
    });

    it('공지 날짜를 YYYY-MM-DD 형식으로 포맷팅한다', () => {
      const category = makeCategory();
      const notice = makeNotice({ createdAt: new Date('2024-03-05') });

      const result = service.createUniversityNoticeCarousel(
        makeResult([{ ...category, notices: [notice] }]),
      );
      const item = (result.outputs[0] as any).carousel.items[0].items[0];

      expect(item.description).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('공지 제목이 항목 title에 포함된다', () => {
      const category = makeCategory();
      const notice = makeNotice({ title: '2024학년도 수강신청 안내' });

      const result = service.createUniversityNoticeCarousel(
        makeResult([{ ...category, notices: [notice] }]),
      );
      const item = (result.outputs[0] as any).carousel.items[0].items[0];

      expect(item.title).toBe('2024학년도 수강신청 안내');
    });
  });

  describe('createDepartmentNoticeCarousel', () => {
    it('캐러셀 타입의 SkillTemplate을 반환한다', () => {
      const category = makeCategory();
      const notice = makeNotice();

      const result = service.createDepartmentNoticeCarousel(
        makeResult([{ ...category, notices: [notice] }]),
      );

      expect(result.outputs).toHaveLength(1);
      expect((result.outputs[0] as any).carousel.type).toBe('listCard');
    });

    it('카드 헤더 타이틀이 "${학과명} - ${카테고리}" 형식이다', () => {
      const category = makeCategory({
        category: '공지',
        departmentName: '컴퓨터공학부',
        departmentEn: 'cse',
        notices: [makeNotice()],
      });

      const result = service.createDepartmentNoticeCarousel(makeResult([category]));
      const header = (result.outputs[0] as any).carousel.items[0].header;

      expect(header.title).toBe('컴퓨터공학부 - 공지');
    });

    it('공지 항목의 링크 URL이 학과 공지 URL 형식을 따른다', () => {
      const category = makeCategory({
        mi: 300,
        bbsId: 400,
      });
      const notice = makeNotice({ nttSn: 99 });

      const result = service.createDepartmentNoticeCarousel(
        makeResult([{ ...category, notices: [notice] }]),
      );
      const item = (result.outputs[0] as any).carousel.items[0].items[0];

      expect(item.link.web).toBe(
        'https://www.gnu.ac.kr/cse/na/ntt/selectNttInfo.do?mi=300&bbsId=400&nttSn=99',
      );
    });

    it('"더보기" 버튼이 게시판 목록 URL을 가진다', () => {
      const category = makeCategory({
        mi: 300,
        bbsId: 400,
        notices: [makeNotice()],
      });

      const result = service.createDepartmentNoticeCarousel(makeResult([category]));
      const buttons = (result.outputs[0] as any).carousel.items[0].buttons;

      expect(buttons).toHaveLength(1);
      expect(buttons[0].label).toBe('더보기');
      expect(buttons[0].webLinkUrl).toBe(
        'https://www.gnu.ac.kr/cse/na/ntt/selectNttList.do?mi=300&bbsId=400',
      );
    });
  });
});
