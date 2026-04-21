import { BadRequestException, Controller, Post, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { CommonMessagesService } from 'src/api/public/common/common-messages.service';
import { ScheduleMessagesService } from 'src/api/public/schedules/schedule-messages.service';
import { ListAcademicScheduleExtraDto } from './dtos/requests/list-academic-schedule-request.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('schedules')
@Controller('schedules')
@UseFilters(OpenBuilderExceptionFilter)
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly scheduleMessagesService: ScheduleMessagesService,
    private readonly commonMessagesService: CommonMessagesService,
  ) {}

  @Post()
  @ApiSkillBody(ListAcademicScheduleExtraDto)
  async listAcademicSchedules(
    @ClientExtra(ListAcademicScheduleExtraDto) extra: ListAcademicScheduleExtraDto,
  ) {
    const { month } = extra;

    if (month !== undefined && (month < 1 || month > 12)) {
      const template = this.commonMessagesService.createSimpleText('올바른 월을 입력해주세요. (1-12)');
      return new ResponseDTO(template);
    }

    const result = await this.schedulesService.getAcademicSchedules(month);
    const template = this.scheduleMessagesService.createAcademicScheduleTextCard(
      result.year,
      result.month,
      result.schedules,
    );
    return new ResponseDTO(template);
  }
}
