import { Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { ListCafeteriaDietExtraRequestDto } from 'src/api/public/cafeterias/presentation/dtos/requests/list-cafeteria-diet-request.dto';
import { ListCafeteriaRequestDto } from 'src/api/public/cafeterias/presentation/dtos/requests/list-cafeteria-request.dto';
import { CafeteriaMessageFactory } from 'src/api/public/cafeterias/presentation/cafeteria-message.factory';
import { CampusesService } from 'src/api/public/campuses/application/campuses.service';
import { CampusMessageFactory } from 'src/api/public/campuses/presentation/campus-message.factory';
import { CurrentUser } from 'src/api/public/users/presentation/decorators/current-user.decorator';
import { FetchCurrentUser } from 'src/api/public/users/presentation/decorators/fetch-current-user.decorator';
import {
  KakaoBlockId,
  KAKAO_REQUEST_CAMPUS_SELECTION_ID,
} from 'src/api/common/presentation/kakao.constants';
import { User } from 'src/api/public/users/domain/entities/users.entity';
import { KakaoAuthGuard } from 'src/api/public/users/presentation/guards/kakao-auth.guard';
import { getDietTime, getTodayOrTomorrow } from 'src/api/public/cafeterias/application/utils/time';
import { CafeteriasService } from 'src/api/public/cafeterias/application/cafeterias.service';

@ApiTags('cafeterias')
@Controller('cafeterias')
@UseGuards(KakaoAuthGuard)
@UseFilters(OpenBuilderExceptionFilter)
export class CafeteriasKakaoController {
  constructor(
    private readonly cafeteriasService: CafeteriasService,
    private readonly cafeteriaMessageFactory: CafeteriaMessageFactory,
    private readonly campusesService: CampusesService,
    private readonly campusMessageFactory: CampusMessageFactory,
  ) {}

  @Post()
  @FetchCurrentUser()
  @ApiSkillBody(ListCafeteriaRequestDto)
  async listCafeterias(
    @CurrentUser() user: User,
    @ClientExtra(ListCafeteriaRequestDto) extra: ListCafeteriaRequestDto,
  ) {
    const requestedCampusId = extra.campusId;
    const userCampusId = user.campus?.id;

    // '더보기' 버튼 또는 캠퍼스 미설정 → 캠퍼스 선택 카드 반환
    if (
      requestedCampusId === KAKAO_REQUEST_CAMPUS_SELECTION_ID ||
      (!requestedCampusId && !userCampusId)
    ) {
      const result = await this.campusesService.findAll();
      const template = this.campusMessageFactory.createCampusListCard(
        result,
        KakaoBlockId.CAFETERIA_LIST,
      );
      return new ResponseDTO(template);
    }

    const campusId = requestedCampusId ?? userCampusId;
    const result = await this.cafeteriasService.getCafeterias(campusId);
    const template = this.cafeteriaMessageFactory.createCafeteriaListCard(result);
    return new ResponseDTO(template);
  }

  @Post('diet')
  @ApiSkillBody(ListCafeteriaDietExtraRequestDto)
  async listCafeteriaDiets(
    @ClientExtra(ListCafeteriaDietExtraRequestDto)
    extra: ListCafeteriaDietExtraRequestDto,
  ) {
    const { cafeteriaId } = extra;
    const date = getTodayOrTomorrow(extra.date);
    const time = extra.time ?? getDietTime(date);
    const result = await this.cafeteriasService.getCafeteriaDiet(cafeteriaId, date, time);
    const template = this.cafeteriaMessageFactory.createCafeteriaDietListCard(result);
    return new ResponseDTO(template);
  }
}
