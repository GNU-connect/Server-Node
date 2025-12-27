import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { ListCafeteriaDietExtraRequestDto } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { ListCafeteriaRequestDto } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-request.dto';
import { CurrentUser } from 'src/api/public/users/decorators/current-user.decorator';
import { User } from 'src/type-orm/entities/users/users.entity';
import { CafeteriasService } from './cafeterias.service';

@ApiTags('cafeterias')
@Controller('cafeterias')
export class CafeteriasController {
  constructor(private readonly cafeteriasService: CafeteriasService) {}

  @Post()
  @ApiSkillBody(ListCafeteriaRequestDto)
  async listCafeterias(
    @CurrentUser() user: User,
    @ClientExtra(ListCafeteriaRequestDto) extra: ListCafeteriaRequestDto,
  ) {
    const { campusId } = extra;
  
    const template = await this.cafeteriasService.getCafeteriaListTemplate(
      user.campus?.id,
      campusId,
    );

    return new ResponseDTO(template);
  }

  @Post('diet')
  @ApiSkillBody(ListCafeteriaDietExtraRequestDto)
  async listCafeteriaDiets(
    @ClientExtra(ListCafeteriaDietExtraRequestDto)
    extra: ListCafeteriaDietExtraRequestDto,
  ) {
    const { cafeteriaId, date, time } = extra;

    const template = await this.cafeteriasService.getCafeteriaDietTemplate(
      cafeteriaId,
      date,
      time,
    );

    return new ResponseDTO(template);
  }
}
