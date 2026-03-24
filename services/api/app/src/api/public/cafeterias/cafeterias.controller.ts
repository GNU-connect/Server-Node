import { Controller, Post, UseFilters } from '@nestjs/common';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { TraceSpan } from 'src/api/common/decorators/trace-span.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { ListCafeteriaDietExtraRequestDto } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { ListCafeteriaRequestDto } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-request.dto';
import { CurrentUser } from 'src/api/public/users/decorators/current-user.decorator';
import { FetchCurrentUser } from 'src/api/public/users/decorators/fetch-current-user.decorator';
import { User } from 'src/type-orm/entities/users/users.entity';
import { CafeteriasService } from './cafeterias.service';

@ApiTags('cafeterias')
@Controller('cafeterias')
@UseFilters(OpenBuilderExceptionFilter)
export class CafeteriasController {
  constructor(private readonly cafeteriasService: CafeteriasService) {}

  @Post()
  @FetchCurrentUser()
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
  @TraceSpan({
    name: 'cafeterias.controller.listCafeteriaDiets',
    op: 'function.nestjs.controller',
    attributes: ([extra]) => {
      const request = extra as ListCafeteriaDietExtraRequestDto;

      return {
        cafeteriaId: request.cafeteriaId,
        dietDate: request.date ?? 'auto',
        dietTime: request.time ?? 'auto',
      };
    },
  })
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
