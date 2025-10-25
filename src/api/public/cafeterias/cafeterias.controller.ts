import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { SkillExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { BlockId } from 'src/api/common/utils/constants';
import { CafeteriaMessagesService } from 'src/api/public/cafeterias/cafeteria-messages.service';
import { ListCafeteriaRequestDto } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-request.dto';
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
    @SkillExtra(ListCafeteriaRequestDto) extra: ListCafeteriaRequestDto,
  ) {
    const { id: userCampusId } = user.campus;
    const { campusId: requestedCampusId } = extra;

    let template = null;

    // '더보기' 버튼을 누르거나 사용자 정보가 없을 경우 캠퍼스 목록 카드 반환
    if (requestedCampusId === -1 || userCampusId === null) {
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
}
