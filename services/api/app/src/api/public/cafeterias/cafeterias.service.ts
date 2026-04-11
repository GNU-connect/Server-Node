import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { BlockId } from 'src/api/common/utils/constants';
import { CafeteriaMessagesService } from 'src/api/public/cafeterias/cafeteria-messages.service';
import {
  DietDate,
  DietTime,
} from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import {
  getDietTime,
  getTodayOrTomorrow,
} from 'src/api/public/cafeterias/utils/time';
import { CampusesService } from 'src/api/public/campuses/campuses.service';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';

@Injectable()
export class CafeteriasService {
  readonly logger = new Logger(CafeteriasService.name);

  constructor(
    private readonly cafeteriasRepository: CafeteriasRepository,
    private readonly campusesService: CampusesService,
    private readonly cafeteriaMessagesService: CafeteriaMessagesService,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  /**
   * 식당 목록 템플릿 조회
   */
  @CacheKey({
    key: ([userCampusId, requestedCampusId]) => {
      if (requestedCampusId === -1) {
        return 'cafeteria-list:campus-select';
      }
      const campusId =
        (requestedCampusId as number | undefined) ?? (userCampusId as number | undefined);
      if (!campusId) {
        return 'cafeteria-list:campus-select';
      }
      return `cafeteria-list:campus:${campusId}`;
    },
  })
  public async getCafeteriaListTemplate(
    userCampusId?: number,
    requestedCampusId?: number,
  ): Promise<SkillTemplate> {
    // 1. '더보기' 버튼을 누른 경우 캠퍼스 선택 카드 반환
    if (requestedCampusId === -1) {
      return this.campusesService.campusesListCard(BlockId.CAFETERIA_LIST);
    }

    // 2. 캠퍼스 ID 결정: 요청된 캠퍼스 ID 우선, 없으면 사용자 캠퍼스 ID 사용
    const campusId = requestedCampusId ?? userCampusId;

    // 3. 캠퍼스 ID가 없으면 캠퍼스 선택 카드 반환 (비로그인 유저 최초 진입)
    if (!campusId) {
      return this.campusesService.campusesListCard(BlockId.CAFETERIA_LIST);
    }

    // 4. 식당 목록 조회
    const cafeterias = await this.cafeteriasRepository.findCafeteriasByCampusId(campusId);

    // 5. 식당 목록 카드 생성
    return this.cafeteriaMessagesService.cafeteriasListCard(cafeterias);
  }

  /**
   * 식당 식단 템플릿 조회
   */
  @CacheKey({
    key: ([cafeteriaId, dietDate, dietTime]) => {
      const date = getTodayOrTomorrow(dietDate as DietDate | undefined);
      const time = (dietTime as DietTime | undefined) ?? getDietTime(date);
      return `diet:${cafeteriaId as number}:${date.toISOString().slice(0, 10)}:${time}`;
    },
  })
  public async getCafeteriaDietTemplate(
    cafeteriaId: number,
    dietDate?: DietDate,
    dietTime?: DietTime,
  ): Promise<SkillTemplate> {
    // 1. 날짜 및 시간 기본값 설정 (시간대에 따라 오늘 또는 내일 날짜 반환)
    const date = getTodayOrTomorrow(dietDate);
    const time = dietTime ?? getDietTime(date);

    // 2. 식당 정보 및 식단 목록 조회
    const cafeteria = await this.cafeteriasRepository.findCafeteriaById(cafeteriaId);
    const diets = await this.cafeteriasRepository.findCafeteriaDietsByCafeteriaId(
      cafeteriaId,
      date,
      time,
    );

    if (!cafeteria) {
      throw new NotFoundException(`식당(${cafeteriaId}) 정보를 찾을 수 없습니다.`);
    }

    // 3. 식단 카드 생성
    return this.cafeteriaMessagesService.cafeteriaDietsListCard(
      cafeteria,
      date,
      time,
      diets,
    );
  }
}
