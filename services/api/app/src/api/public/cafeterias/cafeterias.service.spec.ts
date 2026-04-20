import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';
import { CafeteriasService } from './cafeterias.service';

const makeCafeteria = (overrides: Partial<Cafeteria> = {}): Cafeteria =>
  ({
    id: 1,
    name: '제1학생회관',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    campus: { id: 1, name: '가좌캠퍼스' },
    ...overrides,
  } as Cafeteria);

describe('CafeteriasService', () => {
  let service: CafeteriasService;
  let cafeteriasRepository: jest.Mocked<CafeteriasRepository>;
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
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe('getCafeterias', () => {
    it('캠퍼스 ID로 식당 목록을 반환한다', async () => {
      const cafeterias = [makeCafeteria()];
      cafeteriasRepository.findCafeteriasByCampusId.mockResolvedValue(cafeterias);

      const result = await service.getCafeterias(1);

      expect(cafeteriasRepository.findCafeteriasByCampusId).toHaveBeenCalledWith(1);
      expect(result).toBe(cafeterias);
    });

    it('cache hit이면 DB 조회 없이 캐시 값을 반환한다', async () => {
      const cachedCafeterias = [makeCafeteria()];
      cacheManager.get.mockResolvedValue(cachedCafeterias);

      const result = await service.getCafeterias(1);

      expect(result).toBe(cachedCafeterias);
      expect(cafeteriasRepository.findCafeteriasByCampusId).not.toHaveBeenCalled();
    });
  });

  describe('getCafeteriaDiet', () => {
    it('식당 정보와 식단 목록을 포함한 결과를 반환한다', async () => {
      const cafeteria = makeCafeteria({ id: 5 });
      const diets: CafeteriaDiet[] = [
        { id: 1, cafeteriaId: 5, dishName: '김치찌개', dishCategory: '한식', dishType: '국' } as any,
      ];
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(cafeteria);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue(diets);

      const result = await service.getCafeteriaDiet(5, '오늘', '점심');

      expect(result.cafeteria).toBe(cafeteria);
      expect(result.diets).toBe(diets);
      expect(result.time).toBe('점심');
      expect(result.date).toBeInstanceOf(Date);
    });

    it('dietTime이 없으면 현재 시각 기반으로 자동 결정된다', async () => {
      const cafeteria = makeCafeteria();
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(cafeteria);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue([]);

      const result = await service.getCafeteriaDiet(1, '오늘', undefined);

      expect(['아침', '점심', '저녁']).toContain(result.time);
    });

    it('dietDate가 "내일"이면 내일 날짜로 조회한다', async () => {
      const cafeteria = makeCafeteria();
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(cafeteria);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue([]);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await service.getCafeteriaDiet(1, '내일', '아침');

      expect(result.date.getDate()).toBe(tomorrow.getDate());
    });

    it('식당을 찾을 수 없으면 NotFoundException을 던진다', async () => {
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(null);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue([]);

      await expect(service.getCafeteriaDiet(999, '오늘', '점심')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('cache miss이면 DB를 조회하고 결과를 캐시에 저장한다', async () => {
      cacheManager.get.mockResolvedValue(null);
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(makeCafeteria());
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue([]);

      const result = await service.getCafeteriaDiet(1, '오늘', '점심');

      expect(cafeteriasRepository.findCafeteriaById).toHaveBeenCalledWith(1);
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.stringMatching(/^diet:1:\d{4}-\d{2}-\d{2}:점심$/),
        result,
      );
    });
  });
});
