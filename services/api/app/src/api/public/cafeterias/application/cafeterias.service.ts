import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';
import { DietTime } from 'src/api/public/cafeterias/presentation/dtos/requests/list-cafeteria-diet-request.dto';
import {
  CafeteriaDietItemResult,
  CafeteriaDietResult,
  CafeteriaMenuGroupResult,
} from 'src/api/public/cafeterias/application/dtos/results/cafeteria-diet-result.dto';
import { CafeteriaListResult } from 'src/api/public/cafeterias/application/dtos/results/cafeteria-list-result.dto';
import { CafeteriasRepository } from 'src/api/public/cafeterias/infrastructure/cafeterias.repository';

@Injectable()
export class CafeteriasService {
  constructor(
    private readonly cafeteriasRepository: CafeteriasRepository,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  /**
   * 캠퍼스별 식당 목록 조회
   */
  @CacheKey({
    key: ([campusId]) => `cafeteria-list:campus:${campusId as number}`,
  })
  public async getCafeterias(campusId: number): Promise<CafeteriaListResult> {
    const cafeterias = await this.cafeteriasRepository.findCafeteriasByCampusId(campusId);
    return {
      cafeterias: cafeterias.map(cafeteria => ({
        id: cafeteria.id,
        name: cafeteria.name,
        thumbnailUrl: cafeteria.thumbnailUrl,
        campus: {
          id: cafeteria.campus.id,
          name: cafeteria.campus.name,
          thumbnailUrl: cafeteria.campus.thumbnailUrl,
        },
      })),
    };
  }

  /**
   * 식당 식단 정보 조회
   */
  @CacheKey({
    key: ([cafeteriaId, date, time]) =>
      `diet:${cafeteriaId as number}:${(date as Date).toISOString().slice(0, 10)}:${
        time as DietTime
      }`,
  })
  public async getCafeteriaDiet(
    cafeteriaId: number,
    date: Date,
    time: DietTime,
  ): Promise<CafeteriaDietResult> {
    const cafeteria = await this.cafeteriasRepository.findCafeteriaById(cafeteriaId);

    if (!cafeteria) {
      throw new NotFoundException(`식당(${cafeteriaId}) 정보를 찾을 수 없습니다.`);
    }

    const diets = await this.cafeteriasRepository.findCafeteriaDietsByCafeteriaId(
      cafeteriaId,
      date,
      time,
    );

    const dietResults = diets.map(diet => ({
      dishCategory: diet.dishCategory,
      dishType: diet.dishType,
      dishName: diet.dishName,
    }));

    return {
      cafeteria: {
        id: cafeteria.id,
        name: cafeteria.name,
        thumbnailUrl: cafeteria.thumbnailUrl,
        campus: {
          id: cafeteria.campus.id,
          name: cafeteria.campus.name,
          thumbnailUrl: cafeteria.campus.thumbnailUrl,
        },
      },
      menuGroups: this.groupDietsByCategory(dietResults),
      date,
      time,
    };
  }

  private groupDietsByCategory(diets: CafeteriaDietItemResult[]): CafeteriaMenuGroupResult[] {
    const grouped = new Map<string, string[]>();

    for (const diet of diets) {
      const category = diet.dishCategory || diet.dishType || '';
      const items = grouped.get(category) ?? [];
      items.push(diet.dishName);
      grouped.set(category, items);
    }

    return Array.from(grouped.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }
}
