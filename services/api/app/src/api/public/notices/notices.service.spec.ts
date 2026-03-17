import { Test, TestingModule } from '@nestjs/testing';
import { NoticesService } from './notices.service';
import { NoticesRepository } from 'src/type-orm/entities/notices/notices.repository';
import { NoticeCategoriesRepository } from 'src/type-orm/entities/notices/notice-categories.repository';
import { NoticeMessagesService } from 'src/api/public/message-templates/notice-messages.service';
import { CommonMessagesService } from 'src/api/public/message-templates/common-messages.service';
import { NoticeCategory } from 'src/type-orm/entities/notices/notice-category.entity';
import { Notice } from 'src/type-orm/entities/notices/notice.entity';
import { User } from 'src/type-orm/entities/users/users.entity';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';

const makeCategory = (overrides: Partial<NoticeCategory> = {}): NoticeCategory =>
  ({
    id: 1,
    departmentId: 117,
    category: '학사',
    mi: 100,
    bbsId: 200,
    lastNttSn: 0,
    updatedAt: new Date(),
    department: { id: 117, name: '학교', departmentEn: 'main', parentDepartmentId: null },
    notices: [],
    ...overrides,
  } as NoticeCategory);

const makeNotice = (overrides: Partial<Notice> = {}): Notice =>
  ({
    id: 1,
    categoryId: 1,
    title: '공지사항 제목',
    nttSn: 1000,
    createdAt: new Date('2024-06-01'),
    ...overrides,
  } as Notice);

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'kakao-user-id',
    campus: { id: 1, name: '가좌캠퍼스' } as any,
    department: {
      id: 10,
      name: '컴퓨터공학부',
      departmentEn: 'cse',
      parentDepartmentId: null,
    } as any,
    ...overrides,
  } as User);

const SIMPLE_TEXT_TEMPLATE: SkillTemplate = { outputs: [{ simpleText: { text: '' } } as any] };
const AUTH_REQUIRED_TEMPLATE: SkillTemplate = { outputs: [{ textCard: {} } as any] };
const CAROUSEL_TEMPLATE: SkillTemplate = { outputs: [{ carousel: {} } as any] };

describe('NoticesService', () => {
  let service: NoticesService;
  let noticesRepository: jest.Mocked<NoticesRepository>;
  let noticeCategoriesRepository: jest.Mocked<NoticeCategoriesRepository>;
  let noticeMessagesService: jest.Mocked<NoticeMessagesService>;
  let commonMessagesService: jest.Mocked<CommonMessagesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticesService,
        {
          provide: NoticesRepository,
          useValue: {
            findRecentByCategoryIds: jest.fn(),
          },
        },
        {
          provide: NoticeCategoriesRepository,
          useValue: {
            findByDepartmentIdAndCategories: jest.fn(),
            findByDepartmentIds: jest.fn(),
          },
        },
        {
          provide: NoticeMessagesService,
          useValue: {
            createUniversityNoticeCarousel: jest.fn(),
            createDepartmentNoticeCarousel: jest.fn(),
          },
        },
        {
          provide: CommonMessagesService,
          useValue: {
            createSimpleText: jest.fn().mockReturnValue(SIMPLE_TEXT_TEMPLATE),
            createDepartmentAuthRequiredMessage: jest.fn().mockReturnValue(AUTH_REQUIRED_TEMPLATE),
          },
        },
      ],
    }).compile();

    service = module.get<NoticesService>(NoticesService);
    noticesRepository = module.get(NoticesRepository);
    noticeCategoriesRepository = module.get(NoticeCategoriesRepository);
    noticeMessagesService = module.get(NoticeMessagesService);
    commonMessagesService = module.get(CommonMessagesService);
  });

  describe('getUniversityNoticeTemplate', () => {
    it('카테고리가 없으면 "카테고리를 찾을 수 없습니다" 메시지를 반환한다', async () => {
      noticeCategoriesRepository.findByDepartmentIdAndCategories.mockResolvedValue([]);

      const result = await service.getUniversityNoticeTemplate();

      expect(commonMessagesService.createSimpleText).toHaveBeenCalledWith(
        '학교 공지사항 카테고리를 찾을 수 없습니다.',
      );
      expect(result).toBe(SIMPLE_TEXT_TEMPLATE);
    });

    it('공지사항이 없으면 "현재 등록된 공지사항이 없습니다" 메시지를 반환한다', async () => {
      const category = makeCategory({ id: 1, category: '학사' });
      noticeCategoriesRepository.findByDepartmentIdAndCategories.mockResolvedValue([category]);
      // 모든 카테고리에 공지 없음
      noticesRepository.findRecentByCategoryIds.mockResolvedValue(new Map());

      const result = await service.getUniversityNoticeTemplate();

      expect(commonMessagesService.createSimpleText).toHaveBeenCalledWith(
        '현재 등록된 공지사항이 없습니다.',
      );
      expect(result).toBe(SIMPLE_TEXT_TEMPLATE);
    });

    it('공지가 있으면 createUniversityNoticeCarousel을 호출한다', async () => {
      const category = makeCategory({ id: 1, category: '학사' });
      const notice = makeNotice({ categoryId: 1 });
      const noticeMap = new Map([[1, [notice]]]);

      noticeCategoriesRepository.findByDepartmentIdAndCategories.mockResolvedValue([category]);
      noticesRepository.findRecentByCategoryIds.mockResolvedValue(noticeMap);
      noticeMessagesService.createUniversityNoticeCarousel.mockReturnValue(CAROUSEL_TEMPLATE);

      const result = await service.getUniversityNoticeTemplate();

      expect(noticeMessagesService.createUniversityNoticeCarousel).toHaveBeenCalled();
      expect(result).toBe(CAROUSEL_TEMPLATE);
    });

    it('TARGET_CATEGORIES 순서대로 캐러셀 Map이 구성된다', async () => {
      const TARGET_CATEGORIES = ['기관', '채용', '장학', '외부기관 행사', '학사'];
      const categories = TARGET_CATEGORIES.map((cat, idx) =>
        makeCategory({ id: idx + 1, category: cat }),
      );
      const noticeMap = new Map(
        categories.map((cat) => [cat.id, [makeNotice({ categoryId: cat.id })]]),
      );

      noticeCategoriesRepository.findByDepartmentIdAndCategories.mockResolvedValue(categories);
      noticesRepository.findRecentByCategoryIds.mockResolvedValue(noticeMap);
      noticeMessagesService.createUniversityNoticeCarousel.mockReturnValue(CAROUSEL_TEMPLATE);

      await service.getUniversityNoticeTemplate();

      const passedMap: Map<NoticeCategory, Notice[]> =
        noticeMessagesService.createUniversityNoticeCarousel.mock.calls[0][0];

      const keys = [...passedMap.keys()].map((c) => c.category);
      expect(keys).toEqual(TARGET_CATEGORIES);
    });

    it('공지가 없는 카테고리는 캐러셀 Map에서 제외된다', async () => {
      const catWithNotices = makeCategory({ id: 1, category: '학사' });
      const catWithoutNotices = makeCategory({ id: 2, category: '채용' });
      // id 1만 공지 있음
      const noticeMap = new Map([[1, [makeNotice({ categoryId: 1 })]]]);

      noticeCategoriesRepository.findByDepartmentIdAndCategories.mockResolvedValue([
        catWithNotices,
        catWithoutNotices,
      ]);
      noticesRepository.findRecentByCategoryIds.mockResolvedValue(noticeMap);
      noticeMessagesService.createUniversityNoticeCarousel.mockReturnValue(CAROUSEL_TEMPLATE);

      await service.getUniversityNoticeTemplate();

      const passedMap: Map<NoticeCategory, Notice[]> =
        noticeMessagesService.createUniversityNoticeCarousel.mock.calls[0][0];

      expect(passedMap.size).toBe(1);
      expect([...passedMap.keys()][0].id).toBe(1);
    });

    it('department_id 117로 카테고리를 조회한다', async () => {
      noticeCategoriesRepository.findByDepartmentIdAndCategories.mockResolvedValue([]);

      await service.getUniversityNoticeTemplate();

      expect(noticeCategoriesRepository.findByDepartmentIdAndCategories).toHaveBeenCalledWith(
        117,
        expect.any(Array),
      );
    });
  });

  describe('getDepartmentNoticeTemplate', () => {
    it('user.department가 null이면 학과 등록 안내 메시지를 반환한다', async () => {
      const user = makeUser({ department: null });

      const result = await service.getDepartmentNoticeTemplate(user);

      expect(commonMessagesService.createDepartmentAuthRequiredMessage).toHaveBeenCalled();
      expect(result).toBe(AUTH_REQUIRED_TEMPLATE);
    });

    it('카테고리가 없으면 "등록된 공지사항 게시판이 없습니다" 메시지를 반환한다', async () => {
      const user = makeUser();
      noticeCategoriesRepository.findByDepartmentIds.mockResolvedValue([]);

      const result = await service.getDepartmentNoticeTemplate(user);

      expect(commonMessagesService.createSimpleText).toHaveBeenCalledWith(
        '등록된 공지사항 게시판이 없습니다.',
      );
      expect(result).toBe(SIMPLE_TEXT_TEMPLATE);
    });

    it('공지사항이 없으면 "현재 등록된 공지사항이 없습니다" 메시지를 반환한다', async () => {
      const user = makeUser();
      const category = makeCategory({ id: 1 });
      noticeCategoriesRepository.findByDepartmentIds.mockResolvedValue([category]);
      noticesRepository.findRecentByCategoryIds.mockResolvedValue(new Map());

      const result = await service.getDepartmentNoticeTemplate(user);

      expect(commonMessagesService.createSimpleText).toHaveBeenCalledWith(
        '현재 등록된 공지사항이 없습니다.',
      );
      expect(result).toBe(SIMPLE_TEXT_TEMPLATE);
    });

    it('공지가 있으면 createDepartmentNoticeCarousel을 호출한다', async () => {
      const user = makeUser();
      const category = makeCategory({ id: 1 });
      const noticeMap = new Map([[1, [makeNotice()]]]);

      noticeCategoriesRepository.findByDepartmentIds.mockResolvedValue([category]);
      noticesRepository.findRecentByCategoryIds.mockResolvedValue(noticeMap);
      noticeMessagesService.createDepartmentNoticeCarousel.mockReturnValue(CAROUSEL_TEMPLATE);

      const result = await service.getDepartmentNoticeTemplate(user);

      expect(noticeMessagesService.createDepartmentNoticeCarousel).toHaveBeenCalled();
      expect(result).toBe(CAROUSEL_TEMPLATE);
    });

    it('parentDepartmentId가 있으면 departmentIds에 부모 학과 ID도 포함된다', async () => {
      const user = makeUser({
        department: {
          id: 10,
          name: '컴퓨터공학부',
          departmentEn: 'cse',
          parentDepartmentId: 5,
        } as any,
      });
      noticeCategoriesRepository.findByDepartmentIds.mockResolvedValue([]);

      await service.getDepartmentNoticeTemplate(user);

      expect(noticeCategoriesRepository.findByDepartmentIds).toHaveBeenCalledWith(
        expect.arrayContaining([10, 5]),
      );
    });

    it('parentDepartmentId가 없으면 자신의 학과 ID만 포함된다', async () => {
      const user = makeUser({
        department: {
          id: 10,
          name: '컴퓨터공학부',
          departmentEn: 'cse',
          parentDepartmentId: null,
        } as any,
      });
      noticeCategoriesRepository.findByDepartmentIds.mockResolvedValue([]);

      await service.getDepartmentNoticeTemplate(user);

      expect(noticeCategoriesRepository.findByDepartmentIds).toHaveBeenCalledWith([10]);
    });
  });
});
