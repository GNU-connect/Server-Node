import { Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import {
  KakaoBlockId,
  KAKAO_LIST_CARD_ITEM_LIMIT,
} from 'src/api/common/presentation/kakao.constants';
import { CampusesService } from 'src/api/public/campuses/application/campuses.service';
import { CollegesService } from 'src/api/public/colleges/application/colleges.service';
import { DepartmentsService } from 'src/api/public/departments/application/departments.service';
import { CampusMessageFactory } from 'src/api/public/campuses/presentation/campus-message.factory';
import { CollegeMessageFactory } from 'src/api/public/colleges/presentation/college-message.factory';
import { CommonMessageFactory } from 'src/api/public/common/presentation/common-message.factory';
import { DepartmentMessageFactory } from 'src/api/public/departments/presentation/department-message.factory';
import { UserMessageFactory } from 'src/api/public/users/presentation/user-message.factory';
import { User } from 'src/api/public/users/domain/entities/users.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { FetchCurrentUser } from './decorators/fetch-current-user.decorator';
import { ListCollegesRequestDto } from './dtos/requests/list-college-request.dto';
import { ListDepartmentsRequestDto } from './dtos/requests/list-department-request.dto';
import { UpsertDepartmentRequestDto } from './dtos/requests/upsert-department-request.dto';
import { KakaoAuthGuard } from './guards/kakao-auth.guard';
import { UsersService } from 'src/api/public/users/application/users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(KakaoAuthGuard)
@UseFilters(OpenBuilderExceptionFilter)
export class UsersKakaoController {
  constructor(
    private readonly usersService: UsersService,
    private readonly campusesService: CampusesService,
    private readonly collegesService: CollegesService,
    private readonly departmentsService: DepartmentsService,
    private readonly campusMessageFactory: CampusMessageFactory,
    private readonly collegeMessageFactory: CollegeMessageFactory,
    private readonly departmentMessageFactory: DepartmentMessageFactory,
    private readonly userMessageFactory: UserMessageFactory,
    private readonly commonMessageFactory: CommonMessageFactory,
  ) {}

  @Post('profile/get')
  @FetchCurrentUser()
  getProfile(@CurrentUser() user: User): ResponseDTO {
    const result = this.usersService.createProfileResult(user);
    const template = this.userMessageFactory.createProfileMessage(result);
    return new ResponseDTO(template);
  }

  @Post('campuses/list')
  async listCampuses(): Promise<ResponseDTO> {
    const result = await this.campusesService.findAll();
    const template = this.campusMessageFactory.createCampusListCard(
      result,
      KakaoBlockId.COLLEGE_LIST,
    );
    return new ResponseDTO(template);
  }

  @Post('colleges/list')
  @ApiSkillBody(ListCollegesRequestDto)
  async listColleges(
    @ClientExtra(ListCollegesRequestDto) extra: ListCollegesRequestDto,
  ): Promise<ResponseDTO> {
    const result = await this.collegesService.findAll(extra.page ?? 1, KAKAO_LIST_CARD_ITEM_LIMIT);
    const template = this.collegeMessageFactory.createCollegeListCard(
      result,
      extra.campusId,
      extra.page ?? 1,
      KakaoBlockId.DEPARTMENT_LIST,
    );
    return new ResponseDTO(template);
  }

  @Post('departments/list')
  @ApiSkillBody(ListDepartmentsRequestDto)
  async listDepartments(
    @ClientExtra(ListDepartmentsRequestDto) extra: ListDepartmentsRequestDto,
  ): Promise<ResponseDTO> {
    const result = await this.departmentsService.findAll(
      extra.collegeId,
      extra.page ?? 1,
      KAKAO_LIST_CARD_ITEM_LIMIT,
    );
    const template = this.departmentMessageFactory.createDepartmentListCard(
      result,
      extra,
      KakaoBlockId.UPDATE_DEPARTMENT,
    );
    return new ResponseDTO(template);
  }

  @Post('department/upsert')
  @FetchCurrentUser()
  @ApiSkillBody(UpsertDepartmentRequestDto)
  async upsert(
    @CurrentUser() user: User,
    @ClientExtra(UpsertDepartmentRequestDto) extra: UpsertDepartmentRequestDto,
  ): Promise<ResponseDTO> {
    await this.usersService.upsert(user.id, extra.campusId, extra.departmentId);
    const template = this.commonMessageFactory.createSimpleText('학과 정보를 등록했어!');
    return new ResponseDTO(template);
  }
}
