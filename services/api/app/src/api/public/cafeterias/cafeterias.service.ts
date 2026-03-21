import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  private readonly logger = new Logger(CafeteriasService.name);

  constructor(
    private readonly cafeteriasRepository: CafeteriasRepository,
    private readonly campusesService: CampusesService,
    private readonly cafeteriaMessagesService: CafeteriaMessagesService,
  ) {}

  /**
   * 식당 목록 템플릿 조회
   */
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
  public async getCafeteriaDietTemplate(
    cafeteriaId: number,
    dietDate?: DietDate,
    dietTime?: DietTime,
  ): Promise<SkillTemplate> {
    // 1. 날짜 및 시간 기본값 설정 (시간대에 따라 오늘 또는 내일 날짜 반환)
    const date = getTodayOrTomorrow(dietDate);
    const time = dietTime ?? getDietTime(date);

    // 2. 식단 목록 조회 (두 쿼리는 독립적이므로 병렬 실행)
    const startedAt = Date.now();
    const queryMeta = `cafeteriaId=${cafeteriaId} date=${date.toISOString()} time=${time}`;

    const cafeteriaPromise = this.cafeteriasRepository
      .findCafeteriaById(cafeteriaId)
      .then((cafeteria) => {
        this.logger.log(
          `[diet:cafeteria] ${queryMeta} ${Date.now() - startedAt}ms`,
        );
        return cafeteria;
      });

    const dietsPromise = this.cafeteriasRepository
      .findCafeteriaDietsByCafeteriaId(cafeteriaId, date, time)
      .then((diets) => {
        this.logger.log(
          `[diet:diets] ${queryMeta} count=${diets.length} ${Date.now() - startedAt}ms`,
        );
        return diets;
      });

    const [cafeteria, diets] = await Promise.all([
      cafeteriaPromise,
      dietsPromise,
    ]);

    if (!cafeteria) {
      throw new NotFoundException(`식당(${cafeteriaId}) 정보를 찾을 수 없습니다.`);
    }

    this.logger.log(`[diet:done] ${queryMeta} ${Date.now() - startedAt}ms`);

    // 3. 식단 카드 생성
    return this.cafeteriaMessagesService.cafeteriaDietsListCard(
      cafeteria,
      date,
      time,
      diets,
    );
  }
}
