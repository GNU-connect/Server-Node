import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { CafeteriasService } from './cafeterias.service';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';
import { CampusesService } from 'src/api/public/campuses/campuses.service';
import { CafeteriaMessagesService } from './cafeteria-messages.service';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';

const makeCafeteria = (overrides: Partial<Cafeteria> = {}): Cafeteria =>
  ({
    id: 1,
    name: '제1학생회관',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    campus: { id: 1, name: '가좌캠퍼스' },
    ...overrides,
  } as Cafeteria);

const CAMPUS_LIST_TEMPLATE: SkillTemplate = { outputs: [{ listCard: {} } as any] };
const CAFETERIA_LIST_TEMPLATE: SkillTemplate = { outputs: [{ listCard: {} } as any] };
const DIET_TEMPLATE: SkillTemplate = { outputs: [{ basicCard: {} } as any] };

describe('CafeteriasService', () => {
  let service: CafeteriasService;
  let cafeteriasRepository: jest.Mocked<CafeteriasRepository>;
  let campusesService: jest.Mocked<CampusesService>;
  let cafeteriaMessagesService: jest.Mocked<CafeteriaMessagesService>;
  let cacheManager: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CafeteriasService,
        {
          provide: CafeteriasRepository,
          useValue: {
            findCafeteriasByCampusId: jest.fn(),
            findCafeteriaById: jest.fn(),
            findCafeteriaDietsByCafeteriaId: jest.fn(),
          },
        },
        {
          provide: CampusesService,
          useValue: {
            campusesListCard: jest.fn().mockResolvedValue(CAMPUS_LIST_TEMPLATE),
          },
        },
        {
          provide: CafeteriaMessagesService,
          useValue: {
            cafeteriasListCard: jest.fn().mockReturnValue(CAFETERIA_LIST_TEMPLATE),
            cafeteriaDietsListCard: jest.fn().mockReturnValue(DIET_TEMPLATE),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CafeteriasService>(CafeteriasService);
    cafeteriasRepository = module.get(CafeteriasRepository);
    campusesService = module.get(CampusesService);
    cafeteriaMessagesService = module.get(CafeteriaMessagesService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe('getCafeteriaListTemplate', () => {
    it('requestedCampusId가 -1이면 캠퍼스 선택 카드를 반환한다', async () => {
      const result = await service.getCafeteriaListTemplate(1, -1);

      expect(campusesService.campusesListCard).toHaveBeenCalled();
      expect(result).toBe(CAMPUS_LIST_TEMPLATE);
    });

    it('campusId가 없으면 캠퍼스 선택 카드를 반환한다', async () => {
      const result = await service.getCafeteriaListTemplate(undefined, undefined);

      expect(campusesService.campusesListCard).toHaveBeenCalled();
      expect(result).toBe(CAMPUS_LIST_TEMPLATE);
    });

    it('userCampusId만 있으면 해당 캠퍼스의 식당 목록을 반환한다', async () => {
      const cafeterias = [makeCafeteria()];
      cafeteriasRepository.findCafeteriasByCampusId.mockResolvedValue(cafeterias);

      const result = await service.getCafeteriaListTemplate(1, undefined);

      expect(cafeteriasRepository.findCafeteriasByCampusId).toHaveBeenCalledWith(1);
      expect(cafeteriaMessagesService.cafeteriasListCard).toHaveBeenCalledWith(cafeterias);
      expect(result).toBe(CAFETERIA_LIST_TEMPLATE);
    });

    it('requestedCampusId가 userCampusId보다 우선한다', async () => {
      const cafeterias = [makeCafeteria({ campus: { id: 2, name: '칠암캠퍼스' } as any })];
      cafeteriasRepository.findCafeteriasByCampusId.mockResolvedValue(cafeterias);

      await service.getCafeteriaListTemplate(1, 2);

      expect(cafeteriasRepository.findCafeteriasByCampusId).toHaveBeenCalledWith(2);
    });

    it('requestedCampusId가 있으면 해당 캠퍼스의 식당 목록을 반환한다', async () => {
      const cafeterias = [makeCafeteria()];
      cafeteriasRepository.findCafeteriasByCampusId.mockResolvedValue(cafeterias);

      const result = await service.getCafeteriaListTemplate(undefined, 3);

      expect(cafeteriasRepository.findCafeteriasByCampusId).toHaveBeenCalledWith(3);
      expect(result).toBe(CAFETERIA_LIST_TEMPLATE);
    });
  });

  describe('getCafeteriaDietTemplate', () => {
    it('식당 정보와 식단 목록을 조회하여 메시지를 생성한다', async () => {
      const cafeteria = makeCafeteria({ id: 5 });
      const diets: CafeteriaDiet[] = [
        { id: 1, cafeteriaId: 5, dishName: '김치찌개', dishCategory: '한식', dishType: '국' } as any,
      ];
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(cafeteria);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue(diets);

      const result = await service.getCafeteriaDietTemplate(5, '오늘', '점심');

      expect(cafeteriasRepository.findCafeteriaById).toHaveBeenCalledWith(5);
      expect(cafeteriasRepository.findCafeteriaDietsByCafeteriaId).toHaveBeenCalledWith(
        5,
        expect.any(Date),
        '점심',
      );
      expect(cafeteriaMessagesService.cafeteriaDietsListCard).toHaveBeenCalledWith(
        cafeteria,
        expect.any(Date),
        '점심',
        diets,
      );
      expect(result).toBe(DIET_TEMPLATE);
    });

    it('dietTime이 없으면 현재 시각 기반으로 자동 결정된다', async () => {
      const cafeteria = makeCafeteria();
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(cafeteria);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue([]);

      await service.getCafeteriaDietTemplate(1, '오늘', undefined);

      expect(cafeteriasRepository.findCafeteriaDietsByCafeteriaId).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        expect.stringMatching(/^(아침|점심|저녁)$/),
      );
    });

    it('dietDate가 "내일"이면 내일 날짜로 조회한다', async () => {
      const cafeteria = makeCafeteria();
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(cafeteria);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue([]);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await service.getCafeteriaDietTemplate(1, '내일', '아침');

      const calledDate = cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mock.calls[0][1];
      expect(calledDate.getDate()).toBe(tomorrow.getDate());
    });
  });

  describe('캐시', () => {
    it('cache hit이면 DB 조회 없이 캐시 값을 반환한다', async () => {
      cacheManager.get.mockResolvedValue(DIET_TEMPLATE);

      const result = await service.getCafeteriaDietTemplate(1, '오늘', '점심');

      expect(result).toBe(DIET_TEMPLATE);
      expect(cafeteriasRepository.findCafeteriaById).not.toHaveBeenCalled();
      expect(cafeteriasRepository.findCafeteriaDietsByCafeteriaId).not.toHaveBeenCalled();
    });

    it('cache miss이면 DB를 조회하고 결과를 캐시에 저장한다', async () => {
      cacheManager.get.mockResolvedValue(null);
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(makeCafeteria());
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue([]);

      const result = await service.getCafeteriaDietTemplate(1, '오늘', '점심');

      expect(cafeteriasRepository.findCafeteriaById).toHaveBeenCalledWith(1);
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringMatching(/^diet:1:\d{4}-\d{2}-\d{2}:점심$/),
        result,
      );
    });
  });
});
