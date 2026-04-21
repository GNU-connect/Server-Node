import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';
import {
  DietDate,
  DietTime,
} from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import {
  getDietTime,
  getTodayOrTomorrow,
} from 'src/api/public/cafeterias/utils/time';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';

export interface CafeteriaDietResult {
  cafeteria: Cafeteria;
  diets: CafeteriaDiet[];
  date: Date;
  time: DietTime;
}

@Injectable()
export class CafeteriasService {
  readonly logger = new Logger(CafeteriasService.name);

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
  public async getCafeterias(campusId: number): Promise<Cafeteria[]> {
    return this.cafeteriasRepository.findCafeteriasByCampusId(campusId);
  }

  /**
   * 식당 식단 정보 조회 (날짜를 직접 받는 Native REST용)
   */
  public async getCafeteriaDietByDate(
    cafeteriaId: number,
    date: Date,
    time?: DietTime,
  ): Promise<CafeteriaDietResult> {
    const resolvedTime = time ?? getDietTime(date);

    const cafeteria = await this.cafeteriasRepository.findCafeteriaById(cafeteriaId);

    if (!cafeteria) {
      throw new NotFoundException(`식당(${cafeteriaId}) 정보를 찾을 수 없습니다.`);
    }

    const diets = await this.cafeteriasRepository.findCafeteriaDietsByCafeteriaId(
      cafeteriaId,
      date,
      resolvedTime,
    );

    return { cafeteria, diets, date, time: resolvedTime };
  }

  /**
   * 식당 식단 정보 조회
   */
  @CacheKey({
    key: ([cafeteriaId, dietDate, dietTime]) => {
      const date = getTodayOrTomorrow(dietDate as DietDate | undefined);
      const time = (dietTime as DietTime | undefined) ?? getDietTime(date);
      return `diet:${cafeteriaId as number}:${date.toISOString().slice(0, 10)}:${time}`;
    },
  })
  public async getCafeteriaDiet(
    cafeteriaId: number,
    dietDate?: DietDate,
    dietTime?: DietTime,
  ): Promise<CafeteriaDietResult> {
    const date = getTodayOrTomorrow(dietDate);
    const time = dietTime ?? getDietTime(date);

    const cafeteria = await this.cafeteriasRepository.findCafeteriaById(cafeteriaId);

    if (!cafeteria) {
      throw new NotFoundException(`식당(${cafeteriaId}) 정보를 찾을 수 없습니다.`);
    }

    const diets = await this.cafeteriasRepository.findCafeteriaDietsByCafeteriaId(
      cafeteriaId,
      date,
      time,
    );

    return { cafeteria, diets, date, time };
  }
}
