import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CafeteriaDiet } from 'src/api/public/cafeterias/domain/entities/cafeteria-diet.entity';
import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { CafeteriasRepository } from 'src/api/public/cafeterias/infrastructure/cafeterias.repository';
import { CafeteriasService } from 'src/api/public/cafeterias/application/cafeterias.service';

const makeCafeteria = (overrides: Partial<Cafeteria> = {}): Cafeteria =>
  ({
    id: 1,
    name: '제1학생회관',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    campus: { id: 1, name: '가좌캠퍼스', thumbnailUrl: 'https://example.com/campus.jpg' },
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
      expect(result.cafeterias).toEqual([
        {
          id: 1,
          name: '제1학생회관',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          campus: {
            id: 1,
            name: '가좌캠퍼스',
            thumbnailUrl: 'https://example.com/campus.jpg',
          },
        },
      ]);
    });

    it('cache hit이면 DB 조회 없이 캐시 값을 반환한다', async () => {
      const cachedResult = { cafeterias: [makeCafeteria()] };
      cacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.getCafeterias(1);

      expect(result).toBe(cachedResult);
      expect(cafeteriasRepository.findCafeteriasByCampusId).not.toHaveBeenCalled();
    });
  });

  describe('getCafeteriaDiet', () => {
    it('식당 정보와 식단 목록을 포함한 결과를 반환한다', async () => {
      const date = new Date('2026-04-21T00:00:00.000Z');
      const cafeteria = makeCafeteria({ id: 5 });
      const diets: CafeteriaDiet[] = [
        {
          id: 1,
          cafeteriaId: 5,
          dishName: '김치찌개',
          dishCategory: '한식',
          dishType: '국',
        } as any,
      ];
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(cafeteria);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue(diets);

      const result = await service.getCafeteriaDiet(5, date, '점심');

      expect(result.cafeteria).toEqual({
        id: 5,
        name: '제1학생회관',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        campus: {
          id: 1,
          name: '가좌캠퍼스',
          thumbnailUrl: 'https://example.com/campus.jpg',
        },
      });
      expect(result.menuGroups).toEqual([
        {
          category: '한식',
          items: ['김치찌개'],
        },
      ]);
      expect(result.time).toBe('점심');
      expect(result.date).toBe(date);
      expect(cafeteriasRepository.findCafeteriaDietsByCafeteriaId).toHaveBeenCalledWith(
        5,
        date,
        '점심',
      );
    });

    it('식단을 카테고리 우선순위에 따라 그룹화한다', async () => {
      const date = new Date('2026-04-21T00:00:00.000Z');
      const cafeteria = makeCafeteria();
      const diets: CafeteriaDiet[] = [
        {
          id: 1,
          cafeteriaId: 1,
          dishName: '김치찌개',
          dishCategory: '한식',
          dishType: '국',
        } as any,
        {
          id: 2,
          cafeteriaId: 1,
          dishName: '된장국',
          dishCategory: null,
          dishType: '국',
        } as any,
        {
          id: 3,
          cafeteriaId: 1,
          dishName: '잡곡밥',
          dishCategory: null,
          dishType: null,
        } as any,
        {
          id: 4,
          cafeteriaId: 1,
          dishName: '제육볶음',
          dishCategory: '한식',
          dishType: '볶음',
        } as any,
      ];
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(cafeteria);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue(diets);

      const result = await service.getCafeteriaDiet(1, date, '점심');

      expect(result.menuGroups).toEqual([
        {
          category: '한식',
          items: ['김치찌개', '제육볶음'],
        },
        {
          category: '국',
          items: ['된장국'],
        },
        {
          category: '',
          items: ['잡곡밥'],
        },
      ]);
    });

    it('식당을 찾을 수 없으면 NotFoundException을 던진다', async () => {
      const date = new Date('2026-04-21T00:00:00.000Z');
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(null);
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue([]);

      await expect(service.getCafeteriaDiet(999, date, '점심')).rejects.toThrow(NotFoundException);
    });

    it('cache miss이면 DB를 조회하고 결과를 캐시에 저장한다', async () => {
      const date = new Date('2026-04-21T00:00:00.000Z');
      cacheManager.get.mockResolvedValue(null);
      cafeteriasRepository.findCafeteriaById.mockResolvedValue(makeCafeteria());
      cafeteriasRepository.findCafeteriaDietsByCafeteriaId.mockResolvedValue([]);

      const result = await service.getCafeteriaDiet(1, date, '점심');

      expect(cafeteriasRepository.findCafeteriaById).toHaveBeenCalledWith(1);
      expect(cacheManager.set).toHaveBeenCalledWith('diet:1:2026-04-21:점심', result);
    });
  });
});
