import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { CurrentUser } from 'src/api/public/users/decorators/current-user.decorator';
import { User } from 'src/type-orm/entities/users/users.entity';
import { ListDepartmentNoticeRequestDto } from './dtos/requests/list-department-notice-request.dto';
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

  @Post('department')
  @ApiSkillBody(ListDepartmentNoticeRequestDto)
  async listDepartmentNotices(@CurrentUser() user: User) {
    const template = await this.noticesService.getDepartmentNoticeTemplate(user);
    return new ResponseDTO(template);
  }
}
