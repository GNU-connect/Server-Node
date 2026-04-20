import { Controller, Post, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { BlockId } from 'src/api/common/utils/constants';
import { CampusesService } from 'src/api/public/campuses/campuses.service';
import { CollegesService } from 'src/api/public/colleges/colleges.service';
import { DepartmentsService } from 'src/api/public/departments/departments.service';
import { CampusMessagesService } from 'src/api/public/message-templates/campus-messages.service';
import { CollegeMessagesService } from 'src/api/public/message-templates/college-messages.service';
import { CommonMessagesService } from 'src/api/public/message-templates/common-messages.service';
import { DepartmentMessagesService } from 'src/api/public/message-templates/department-messages.service';
import { UserMessageService } from 'src/api/public/message-templates/user-messages.service';
import { User } from '../../../type-orm/entities/users/users.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { FetchCurrentUser } from './decorators/fetch-current-user.decorator';
import { ListCollegesRequestDto } from './dtos/requests/list-college-request.dto';
import { ListDepartmentsRequestDto } from './dtos/requests/list-department-request.dto';
import { UpsertDepartmentRequestDto } from './dtos/requests/upsert-department-request.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseFilters(OpenBuilderExceptionFilter)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly campusesService: CampusesService,
    private readonly collegesService: CollegesService,
    private readonly departmentsService: DepartmentsService,
    private readonly campusMessagesService: CampusMessagesService,
    private readonly collegeMessagesService: CollegeMessagesService,
    private readonly departmentMessagesService: DepartmentMessagesService,
    private readonly userMessageService: UserMessageService,
    private readonly commonMessagesService: CommonMessagesService,
  ) {}

  @Post('profile/get')
  @FetchCurrentUser()
  getProfile(@CurrentUser() user: User): ResponseDTO {
    const template = this.userMessageService.createProfileMessage(user);
    return new ResponseDTO(template);
  }

  @Post('campuses/list')
  async listCampuses(): Promise<ResponseDTO> {
    const campuses = await this.campusesService.findAll();
    const template = this.campusMessagesService.createCampusListCard(campuses, BlockId.COLLEGE_LIST);
    return new ResponseDTO(template);
  }

  @Post('colleges/list')
  @ApiSkillBody(ListCollegesRequestDto)
  async listColleges(
    @ClientExtra(ListCollegesRequestDto) extra: ListCollegesRequestDto,
  ): Promise<ResponseDTO> {
    const [colleges, total] = await this.collegesService.findAll(extra.page ?? 1);
    const template = this.collegeMessagesService.collegesListCard(
      colleges,
      total,
      extra.campusId,
      extra.page ?? 1,
      BlockId.DEPARTMENT_LIST,
    );
    return new ResponseDTO(template);
  }

  @Post('departments/list')
  @ApiSkillBody(ListDepartmentsRequestDto)
  async listDepartments(
    @ClientExtra(ListDepartmentsRequestDto) extra: ListDepartmentsRequestDto,
  ): Promise<ResponseDTO> {
    const [departments, total] = await this.departmentsService.findAll(extra);
    const template = await this.departmentMessagesService.departmentsListCard(
      departments,
      total,
      extra,
      BlockId.UPDATE_DEPARTMENT,
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
    await this.usersService.upsert(user.id, extra);
    const template = this.commonMessagesService.createSimpleText('학과 정보를 등록했어!');
    return new ResponseDTO(template);
  }
}
