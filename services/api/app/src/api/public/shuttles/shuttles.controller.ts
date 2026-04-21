import { Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { GetShuttleTimetableRequestDto } from './dtos/request/get-shuttle-timetable-request.dto';
import { ShuttleMessagesService } from './shuttle-messages.service';
import { KakaoAuthGuard } from 'src/api/public/users/guards/kakao-auth.guard';
import { ShuttlesService } from './shuttles.service';

@ApiTags('shuttles')
@Controller('shuttles')
@UseGuards(KakaoAuthGuard)
@UseFilters(OpenBuilderExceptionFilter)
export class ShuttlesController {
  constructor(
    private readonly shuttlesService: ShuttlesService,
    private readonly shuttleMessagesService: ShuttleMessagesService,
  ) {}

  @Post('routes')
  public async getRoutesList(): Promise<ResponseDTO> {
    const routes = await this.shuttlesService.getRoutes();
    const template = this.shuttleMessagesService.createRoutesListCard(routes);
    return new ResponseDTO(template);
  }

  @Post('timetable')
  @ApiSkillBody(GetShuttleTimetableRequestDto)
  public async getTimetable(
    @ClientExtra(GetShuttleTimetableRequestDto)
    extra: GetShuttleTimetableRequestDto,
  ): Promise<ResponseDTO> {
    const record = await this.shuttlesService.getTimetable(extra.routeName);
    const template = this.shuttleMessagesService.createTimetableTextCard(record);
    return new ResponseDTO(template);
  }
}
