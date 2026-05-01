import { Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { CommonMessageFactory } from 'src/api/public/common/common-message.factory';
import { ScheduleMessageFactory } from 'src/api/public/schedules/schedule-message.factory';
import { ListAcademicScheduleExtraDto } from './dtos/requests/list-academic-schedule-request.dto';
import { KakaoAuthGuard } from 'src/api/public/users/guards/kakao-auth.guard';
import { SchedulesService } from './schedules.service';

@ApiTags('schedules')
@Controller('schedules')
@UseGuards(KakaoAuthGuard)
@UseFilters(OpenBuilderExceptionFilter)
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly scheduleMessageFactory: ScheduleMessageFactory,
    private readonly commonMessageFactory: CommonMessageFactory,
  ) {}

  @Post()
  @ApiSkillBody(ListAcademicScheduleExtraDto)
  async listAcademicSchedules(
    @ClientExtra(ListAcademicScheduleExtraDto) extra: ListAcademicScheduleExtraDto,
  ) {
    const { month } = extra;

    if (month !== undefined && (month < 1 || month > 12)) {
      const template =
        this.commonMessageFactory.createSimpleText('올바른 월을 입력해주세요. (1-12)');
      return new ResponseDTO(template);
    }

    const result = await this.schedulesService.getAcademicSchedules(month);
    const template = this.scheduleMessageFactory.createAcademicScheduleTextCard(result);
    return new ResponseDTO(template);
  }
}
