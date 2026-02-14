import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { ListUniversityNoticeRequestDto } from './dtos/requests/list-university-notice-request.dto';
import { NoticesService } from './notices.service';

@ApiTags('notices')
@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post('university')
  @ApiSkillBody(ListUniversityNoticeRequestDto)
  async listUniversityNotices() {
    const template = await this.noticesService.getUniversityNoticeTemplate();
    return new ResponseDTO(template);
  }
}
