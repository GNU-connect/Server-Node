import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { ListAcademicScheduleExtraDto } from './dtos/requests/list-academic-schedule-request.dto';
import { SchedulesService } from './schedules.service';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';

@ApiTags('schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @ApiSkillBody(ListAcademicScheduleExtraDto)
  async listAcademicSchedules(
    @ClientExtra(ListAcademicScheduleExtraDto) extra: ListAcademicScheduleExtraDto,
  ) {
    const month = extra.month;
    const template =
      await this.schedulesService.getAcademicScheduleTemplate(month);
    return new ResponseDTO(template);
  }
}