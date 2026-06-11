import { Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { CommonMessageFactory } from 'src/api/public/common/presentation/common-message.factory';
import { NoticeMessageFactory } from 'src/api/public/notices/presentation/notice-message.factory';
import { CurrentUser } from 'src/api/public/users/presentation/decorators/current-user.decorator';
import { FetchCurrentUser } from 'src/api/public/users/presentation/decorators/fetch-current-user.decorator';
import { User } from 'src/api/public/users/domain/entities/users.entity';
import { ListDepartmentNoticeRequestDto } from './dtos/requests/list-department-notice-request.dto';
import { ListUniversityNoticeRequestDto } from './dtos/requests/list-university-notice-request.dto';
import { KakaoAuthGuard } from 'src/api/public/users/presentation/guards/kakao-auth.guard';
import { NoticesService } from 'src/api/public/notices/application/notices.service';

@ApiTags('notices')
@Controller('notices')
@UseGuards(KakaoAuthGuard)
@UseFilters(OpenBuilderExceptionFilter)
export class NoticesController {
  constructor(
    private readonly noticesService: NoticesService,
    private readonly noticeMessageFactory: NoticeMessageFactory,
    private readonly commonMessageFactory: CommonMessageFactory,
  ) {}

  @Post('university')
  @ApiSkillBody(ListUniversityNoticeRequestDto)
  async listUniversityNotices() {
    const result = await this.noticesService.getUniversityNotices();

    if (result.categories.length === 0) {
      const template = this.commonMessageFactory.createSimpleText('현재 등록된 공지사항이 없어!');
      return new ResponseDTO(template);
    }

    const template = this.noticeMessageFactory.createUniversityNoticeCarousel(result);
    return new ResponseDTO(template);
  }

  @Post('department')
  @FetchCurrentUser()
  @ApiSkillBody(ListDepartmentNoticeRequestDto)
  async listDepartmentNotices(@CurrentUser() user: User) {
    if (!user.department) {
      const template = this.commonMessageFactory.createDepartmentAuthRequiredMessage();
      return new ResponseDTO(template);
    }

    const result = await this.noticesService.getDepartmentNotices(user);

    if (result.categories.length === 0) {
      const template = this.commonMessageFactory.createSimpleText('현재 등록된 공지사항이 없어!');
      return new ResponseDTO(template);
    }

    const template = this.noticeMessageFactory.createDepartmentNoticeCarousel(result);
    return new ResponseDTO(template);
  }
}
