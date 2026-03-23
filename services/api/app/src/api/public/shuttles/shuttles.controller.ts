import { Controller, Post, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { GetShuttleTimetableRequestDto } from './dtos/request/get-shuttle-timetable-request.dto';
import { ShuttlesService } from './shuttles.service';

@ApiTags('shuttles')
@Controller('shuttles')
@UseFilters(OpenBuilderExceptionFilter)
export class ShuttlesController {
  constructor(private readonly shuttlesService: ShuttlesService) {}

  @Post('routes')
  public async getRoutesList(): Promise<ResponseDTO> {
    const template = await this.shuttlesService.getRoutesList();
    return new ResponseDTO(template);
  }

  @Post('timetable')
  @ApiSkillBody(GetShuttleTimetableRequestDto)
  public async getTimetable(
    @ClientExtra(GetShuttleTimetableRequestDto)
    extra: GetShuttleTimetableRequestDto,
  ): Promise<ResponseDTO> {
    const template = await this.shuttlesService.getTimetable(extra);
    return new ResponseDTO(template);
  }
}
