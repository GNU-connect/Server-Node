import { Controller, Post, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { CommonMessagesService } from 'src/api/public/message-templates/common-messages.service';
import { NoticeMessagesService } from 'src/api/public/message-templates/notice-messages.service';
import { CurrentUser } from 'src/api/public/users/decorators/current-user.decorator';
import { FetchCurrentUser } from 'src/api/public/users/decorators/fetch-current-user.decorator';
import { User } from 'src/type-orm/entities/users/users.entity';
import { ListDepartmentNoticeRequestDto } from './dtos/requests/list-department-notice-request.dto';
import { ListUniversityNoticeRequestDto } from './dtos/requests/list-university-notice-request.dto';
import { NoticesService } from './notices.service';

@ApiTags('notices')
@Controller('notices')
@UseFilters(OpenBuilderExceptionFilter)
export class NoticesController {
  constructor(
    private readonly noticesService: NoticesService,
    private readonly noticeMessagesService: NoticeMessagesService,
    private readonly commonMessagesService: CommonMessagesService,
  ) {}

  @Post('university')
  @ApiSkillBody(ListUniversityNoticeRequestDto)
  async listUniversityNotices() {
    const noticesMap = await this.noticesService.getUniversityNotices();

    if (noticesMap.size === 0) {
      const template = this.commonMessagesService.createSimpleText('현재 등록된 공지사항이 없어!');
      return new ResponseDTO(template);
    }

    const template = this.noticeMessagesService.createUniversityNoticeCarousel(noticesMap);
    return new ResponseDTO(template);
  }

  @Post('department')
  @FetchCurrentUser()
  @ApiSkillBody(ListDepartmentNoticeRequestDto)
  async listDepartmentNotices(@CurrentUser() user: User) {
    if (!user.department) {
      const template = this.commonMessagesService.createDepartmentAuthRequiredMessage();
      return new ResponseDTO(template);
    }

    const noticesMap = await this.noticesService.getDepartmentNotices(user);

    if (noticesMap.size === 0) {
      const template = this.commonMessagesService.createSimpleText('현재 등록된 공지사항이 없어!');
      return new ResponseDTO(template);
    }

    const template = this.noticeMessagesService.createDepartmentNoticeCarousel(noticesMap);
    return new ResponseDTO(template);
  }
}
