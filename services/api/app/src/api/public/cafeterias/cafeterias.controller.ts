import { Controller, Post, UseFilters } from '@nestjs/common';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { ListCafeteriaDietExtraRequestDto } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { ListCafeteriaRequestDto } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-request.dto';
import { CafeteriaMessagesService } from 'src/api/public/cafeterias/cafeteria-messages.service';
import { CampusesService } from 'src/api/public/campuses/campuses.service';
import { CampusMessagesService } from 'src/api/public/message-templates/campus-messages.service';
import { CurrentUser } from 'src/api/public/users/decorators/current-user.decorator';
import { FetchCurrentUser } from 'src/api/public/users/decorators/fetch-current-user.decorator';
import { BlockId } from 'src/api/common/utils/constants';
import { User } from 'src/type-orm/entities/users/users.entity';
import { CafeteriasService } from './cafeterias.service';

@ApiTags('cafeterias')
@Controller('cafeterias')
@UseFilters(OpenBuilderExceptionFilter)
export class CafeteriasController {
  constructor(
    private readonly cafeteriasService: CafeteriasService,
    private readonly cafeteriaMessagesService: CafeteriaMessagesService,
    private readonly campusesService: CampusesService,
    private readonly campusMessagesService: CampusMessagesService,
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
    if (requestedCampusId === -1 || (!requestedCampusId && !userCampusId)) {
      const campuses = await this.campusesService.findAll();
      const template = this.campusMessagesService.createCampusListCard(campuses, BlockId.CAFETERIA_LIST);
      return new ResponseDTO(template);
    }

    const campusId = requestedCampusId ?? userCampusId;
    const cafeterias = await this.cafeteriasService.getCafeterias(campusId);
    const template = this.cafeteriaMessagesService.cafeteriasListCard(cafeterias);
    return new ResponseDTO(template);
  }

  @Post('diet')
  @ApiSkillBody(ListCafeteriaDietExtraRequestDto)
  async listCafeteriaDiets(
    @ClientExtra(ListCafeteriaDietExtraRequestDto)
    extra: ListCafeteriaDietExtraRequestDto,
  ) {
    const { cafeteriaId, date, time } = extra;
    const result = await this.cafeteriasService.getCafeteriaDiet(cafeteriaId, date, time);
    const template = this.cafeteriaMessagesService.cafeteriaDietsListCard(
      result.cafeteria,
      result.date,
      result.time,
      result.diets,
    );
    return new ResponseDTO(template);
  }
}
