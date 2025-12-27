import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { BlockId } from 'src/api/common/utils/constants';
import { CafeteriaMessagesService } from 'src/api/public/cafeterias/cafeteria-messages.service';
import { ListCafeteriaDietExtraRequestDto } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { ListCafeteriaRequestDto } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-request.dto';
import {
  getDietTime,
  getTodayOrTomorrow,
} from 'src/api/public/cafeterias/utils/time';
import { CampusesService } from 'src/api/public/campuses/campuses.service';
import { CurrentUser } from 'src/api/public/users/decorators/current-user.decorator';
import { User } from 'src/type-orm/entities/users/users.entity';
import { CafeteriasService } from './cafeterias.service';

@ApiTags('cafeterias')
@Controller('cafeterias')
export class CafeteriasController {
  constructor(
    private readonly cafeteriasService: CafeteriasService,
    private readonly campusesService: CampusesService,
    private readonly cafeteriaMessagesService: CafeteriaMessagesService,
  ) {}

  @Post()
  @ApiSkillBody(ListCafeteriaRequestDto)
  async listCafeterias(
    @CurrentUser() user: User,
    @ClientExtra(ListCafeteriaRequestDto) extra: ListCafeteriaRequestDto,
  ) {
    const userCampusId = user.campus?.id;
    const { campusId: requestedCampusId } = extra;

    let template = null;

    // '더보기' 버튼을 누른 경우
    if (requestedCampusId === -1) {
      template = await this.campusesService.campusesListCard(
        BlockId.CAFETERIA_LIST,
      );
      return new ResponseDTO(template);
    }

    // 캠퍼스 ID 결정: 요청된 캠퍼스 ID 우선, 없으면 사용자 캠퍼스 ID
    const campusId = requestedCampusId ?? userCampusId;

    // 캠퍼스 ID가 없으면 캠퍼스 선택 카드 반환
    if (!campusId) {
      template = await this.campusesService.campusesListCard(
        BlockId.CAFETERIA_LIST,
      );
      return new ResponseDTO(template);
    }

    const cafeterias = await this.cafeteriasService.getCafeterias(
      requestedCampusId,
    );
    template = this.cafeteriaMessagesService.cafeteriasListCard(cafeterias);

    return new ResponseDTO(template);
  }

  @Post('diet')
  @ApiSkillBody(ListCafeteriaDietExtraRequestDto)
  async listCafeteriaDiets(
    @ClientExtra(ListCafeteriaDietExtraRequestDto)
    extra: ListCafeteriaDietExtraRequestDto,
  ) {
    const { cafeteriaId } = extra;

    if (!extra.date) {
      extra.date = getTodayOrTomorrow();
    }

    const date =
      extra.date === '오늘'
        ? new Date()
        : new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

    const time = extra.time ?? getDietTime(date);

    const cafeteria = await this.cafeteriasService.getCafeteria(cafeteriaId);
    const diets = await this.cafeteriasService.getCafeteriaDiets(
      cafeteriaId,
      date,
      time,
    );

    const template = this.cafeteriaMessagesService.cafeteriaDietsListCard(
      cafeteria,
      date,
      time,
      diets,
    );

    return new ResponseDTO(template);
  }
}
