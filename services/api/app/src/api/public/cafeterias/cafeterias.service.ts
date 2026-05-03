import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';
import { CafeteriaResponseDto } from 'src/api/public/cafeterias/dtos/responses/cafeteria-response.dto';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';
import { CafeteriaDietQuery } from 'src/api/public/cafeterias/dtos/cafeteria-diet.query';
import {
  CafeteriaDietResponseDto,
  MenuCategoryDto,
} from 'src/api/public/cafeterias/dtos/responses/cafeteria-diet-response.dto';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';

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
  public async getCafeterias(campusId: number): Promise<CafeteriaResponseDto[]> {
    const cafeterias = await this.cafeteriasRepository.findCafeteriasByCampusId(campusId);
    return cafeterias.map(cafeteria => CafeteriaResponseDto.from(cafeteria));
  }

  /**
   * 식당 식단 정보 조회
   */
  @CacheKey({
    key: ([query]) => {
      const { cafeteriaId, date, time } = query as CafeteriaDietQuery;
      return `diet:${cafeteriaId}:${date.toISOString().slice(0, 10)}:${time}`;
    },
  })
  public async getCafeteriaDiet(query: CafeteriaDietQuery): Promise<CafeteriaDietResponseDto> {
    const { cafeteriaId, date, time } = query;
    // 1. 식당 조회
    const cafeteria = await this.cafeteriasRepository.findCafeteriaById(cafeteriaId);

    if (!cafeteria) {
      throw new NotFoundException(`식당(${cafeteriaId}) 정보를 찾을 수 없습니다.`);
    }

    // 2. 식단 조회
    const diets = await this.cafeteriasRepository.findCafeteriaDietsByCafeteriaId(
      cafeteriaId,
      date,
      time,
    );

    return {
      cafeteria: CafeteriaResponseDto.from(cafeteria),
      menus: this.groupDietsByCategory(diets),
      date: date.toISOString().slice(0, 10),
      time,
    };
  }

  private groupDietsByCategory(diets: CafeteriaDiet[]): MenuCategoryDto[] {
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
