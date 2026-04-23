import { Test, TestingModule } from '@nestjs/testing';
import { NoticeMessagesService } from 'src/api/public/notices/notice-messages.service';
import { NoticeCategory } from 'src/type-orm/entities/notices/notice-category.entity';
import { Notice } from 'src/type-orm/entities/notices/notice.entity';

const makeCategory = (overrides: Partial<NoticeCategory> = {}): NoticeCategory =>
  ({
    id: 1,
    departmentId: 117,
    category: '학사',
    mi: 100,
    bbsId: 200,
    lastNttSn: 0,
    updatedAt: new Date(),
    department: {
      id: 1,
      name: '컴퓨터공학부',
      departmentEn: 'cse',
      parentDepartmentId: null,
    },
    notices: [],
    ...overrides,
  } as NoticeCategory);

const makeNotice = (overrides: Partial<Notice> = {}): Notice =>
  ({
    id: 1,
    categoryId: 1,
    title: '2024학년도 수강신청 안내',
    nttSn: 12345,
    createdAt: new Date('2024-06-01'),
    ...overrides,
  } as Notice);

describe('NoticeMessagesService', () => {
  let service: NoticeMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoticeMessagesService],
    }).compile();

    service = module.get<NoticeMessagesService>(NoticeMessagesService);
  });

  describe('createUniversityNoticeCarousel', () => {
    it('캐러셀 타입의 SkillTemplate을 반환한다', () => {
      const category = makeCategory();
      const notice = makeNotice();
      const map = new Map([[category, [notice]]]);

      const result = service.createUniversityNoticeCarousel(map);

      expect(result.outputs).toHaveLength(1);
      expect(result.outputs[0]).toHaveProperty('carousel');
      expect((result.outputs[0] as any).carousel.type).toBe('listCard');
    });

    it('카테고리마다 ListCard 하나씩 생성한다', () => {
      const cat1 = makeCategory({ id: 1, category: '학사' });
      const cat2 = makeCategory({ id: 2, category: '장학' });
      const map = new Map([
        [cat1, [makeNotice({ id: 1 })]],
        [cat2, [makeNotice({ id: 2 })]],
      ]);

      const result = service.createUniversityNoticeCarousel(map);
      const items = (result.outputs[0] as any).carousel.items;

      expect(items).toHaveLength(2);
    });

    it('카드 헤더 타이틀이 "${category} 공지" 형식이다', () => {
      const category = makeCategory({ category: '학사' });
      const map = new Map([[category, [makeNotice()]]]);

      const result = service.createUniversityNoticeCarousel(map);
      const header = (result.outputs[0] as any).carousel.items[0].header;

      expect(header.title).toBe('학사 공지');
    });

    it('공지 항목의 링크 URL이 학교 공지 URL 형식을 따른다', () => {
      const category = makeCategory({ mi: 100, bbsId: 200 });
      const notice = makeNotice({ nttSn: 12345 });
      const map = new Map([[category, [notice]]]);

      const result = service.createUniversityNoticeCarousel(map);
      const item = (result.outputs[0] as any).carousel.items[0].items[0];

      expect(item.link.web).toBe(
        'https://www.gnu.ac.kr/main/na/ntt/selectNttInfo.do?mi=100&bbsId=200&nttSn=12345',
      );
    });

    it('공지 날짜를 YYYY-MM-DD 형식으로 포맷팅한다', () => {
      const category = makeCategory();
      const notice = makeNotice({ createdAt: new Date('2024-03-05') });
      const map = new Map([[category, [notice]]]);

      const result = service.createUniversityNoticeCarousel(map);
      const item = (result.outputs[0] as any).carousel.items[0].items[0];

      expect(item.description).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('공지 제목이 항목 title에 포함된다', () => {
      const category = makeCategory();
      const notice = makeNotice({ title: '2024학년도 수강신청 안내' });
      const map = new Map([[category, [notice]]]);

      const result = service.createUniversityNoticeCarousel(map);
      const item = (result.outputs[0] as any).carousel.items[0].items[0];

      expect(item.title).toBe('2024학년도 수강신청 안내');
    });
  });

  describe('createDepartmentNoticeCarousel', () => {
    it('캐러셀 타입의 SkillTemplate을 반환한다', () => {
      const category = makeCategory();
      const notice = makeNotice();
      const map = new Map([[category, [notice]]]);

      const result = service.createDepartmentNoticeCarousel(map);

      expect(result.outputs).toHaveLength(1);
      expect((result.outputs[0] as any).carousel.type).toBe('listCard');
    });

    it('카드 헤더 타이틀이 "${학과명} - ${카테고리}" 형식이다', () => {
      const category = makeCategory({
        category: '공지',
        department: {
          id: 1,
          name: '컴퓨터공학부',
          departmentEn: 'cse',
          parentDepartmentId: null,
        } as any,
      });
      const map = new Map([[category, [makeNotice()]]]);

      const result = service.createDepartmentNoticeCarousel(map);
      const header = (result.outputs[0] as any).carousel.items[0].header;

      expect(header.title).toBe('컴퓨터공학부 - 공지');
    });

    it('공지 항목의 링크 URL이 학과 공지 URL 형식을 따른다', () => {
      const category = makeCategory({
        mi: 300,
        bbsId: 400,
        department: {
          id: 1,
          name: '컴퓨터공학부',
          departmentEn: 'cse',
          parentDepartmentId: null,
        } as any,
      });
      const notice = makeNotice({ nttSn: 99 });
      const map = new Map([[category, [notice]]]);

      const result = service.createDepartmentNoticeCarousel(map);
      const item = (result.outputs[0] as any).carousel.items[0].items[0];

      expect(item.link.web).toBe(
        'https://www.gnu.ac.kr/cse/na/ntt/selectNttInfo.do?mi=300&bbsId=400&nttSn=99',
      );
    });

    it('"더보기" 버튼이 게시판 목록 URL을 가진다', () => {
      const category = makeCategory({
        mi: 300,
        bbsId: 400,
        department: {
          id: 1,
          name: '컴퓨터공학부',
          departmentEn: 'cse',
          parentDepartmentId: null,
        } as any,
      });
      const map = new Map([[category, [makeNotice()]]]);

      const result = service.createDepartmentNoticeCarousel(map);
      const buttons = (result.outputs[0] as any).carousel.items[0].buttons;

      expect(buttons).toHaveLength(1);
      expect(buttons[0].label).toBe('더보기');
      expect(buttons[0].webLinkUrl).toBe(
        'https://www.gnu.ac.kr/cse/na/ntt/selectNttList.do?mi=300&bbsId=400',
      );
    });
  });
});
