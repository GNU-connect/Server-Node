import * as Sentry from '@sentry/node';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TraceSpan } from 'src/api/common/decorators/trace-span.decorator';
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
  @TraceSpan({
    name: 'cafeterias.service.getCafeteriaDietTemplate',
    op: 'function.service',
    attributes: ([cafeteriaId, dietDate, dietTime]) => ({
      cafeteriaId: cafeteriaId as number,
      requestedDietDate: (dietDate as DietDate | undefined) ?? 'auto',
      requestedDietTime: (dietTime as DietTime | undefined) ?? 'auto',
    }),
  })
  public async getCafeteriaDietTemplate(
    cafeteriaId: number,
    dietDate?: DietDate,
    dietTime?: DietTime,
  ): Promise<SkillTemplate> {
    // 1. 날짜 및 시간 기본값 설정 (시간대에 따라 오늘 또는 내일 날짜 반환)
    const date = Sentry.startSpan(
      {
        name: 'cafeterias.service.resolveDietDate',
        op: 'function.service.prepare.date',
        attributes: {
          cafeteriaId,
          requestedDietDate: dietDate ?? 'auto',
        },
      },
      () => getTodayOrTomorrow(dietDate),
    );

    const time = Sentry.startSpan(
      {
        name: 'cafeterias.service.resolveDietTime',
        op: 'function.service.prepare.time',
        attributes: {
          cafeteriaId,
          requestedDietDate: dietDate ?? 'auto',
          requestedDietTime: dietTime ?? 'auto',
          dietDate: date.toISOString().slice(0, 10),
        },
      },
      () => dietTime ?? getDietTime(date),
    );

    // 2. 식당 정보 및 식단 목록 조회 (리포지토리 스팬을 한 단계로 묶어 워터폴에서 구간이 보이게 함)
    const { cafeteria, diets } = await Sentry.startSpan(
      {
        name: 'cafeterias.service.loadCafeteriaData',
        op: 'function.service.load',
        attributes: {
          cafeteriaId,
          dietDate: date.toISOString().slice(0, 10),
          dietTime: time,
        },
      },
      async () => {
        const cafeteria = await this.cafeteriasRepository.findCafeteriaById(
          cafeteriaId,
        );
        const diets =
          await this.cafeteriasRepository.findCafeteriaDietsByCafeteriaId(
            cafeteriaId,
            date,
            time,
          );
        return { cafeteria, diets };
      },
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
