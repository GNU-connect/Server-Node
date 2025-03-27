import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CampusesService } from 'src/campuses/campuses.service';
import { ApiSkillBody } from 'src/common/decorators/api-skill-body.decorator';
import { SkillPayloadDto } from 'src/common/dtos/requests/skill-payload.dto';
import { ResponseDTO } from 'src/common/dtos/response.dto';
import { BlockId } from 'src/common/utils/constants';
import { CurrentUser } from './decorators/current-user.decorator';
import { ListCollegesRequestDto } from './dtos/requests/list-college-request.dto';
import { ListDepartmentsRequestDto } from './dtos/requests/list-department-request.dto';
import { UpsertDepartmentRequestDto } from './dtos/requests/upsert-department-request.dto';
import { User } from './entities/users.entity';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import { UsersService } from './users.service';
import { CollegesService } from 'src/colleges/colleges.service';
import { DepartmentsService } from 'src/departments/departments.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly campusesService: CampusesService,
    private readonly collegesService: CollegesService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Post('profile/get')
  @UseInterceptors(CurrentUserInterceptor)
  async getProfile(@CurrentUser() user: User): Promise<ResponseDTO> {
    const template = await this.usersService.profileTextCard(user);
    return new ResponseDTO(template);
  }

  @Post('campuses/list')
  async listCampuses(): Promise<ResponseDTO> {
    const blockId = BlockId.COLLEGE_LIST;
    const template = await this.campusesService.campusesListCard(blockId);
    return new ResponseDTO(template);
  }

  @Post('colleges/list')
  @ApiSkillBody(ListCollegesRequestDto)
  async listColleges(@Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const { campusId, page } = plainToInstance(
      ListCollegesRequestDto,
      body.action.clientExtra,
    );
    const blockId = BlockId.DEPARTMENT_LIST;
    const template = await this.collegesService.collegesListCard(
      campusId,
      page,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('departments/list')
  @ApiSkillBody(ListDepartmentsRequestDto)
  async listDepartments(@Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const { campusId, collegeId, page } = plainToInstance(
      ListDepartmentsRequestDto,
      body.action.clientExtra,
    );
    const blockId = BlockId.UPDATE_DEPARTMENT;
    const template = await this.departmentsService.departmentsListCard(
      campusId,
      collegeId,
      page,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('department/upsert')
  @UseInterceptors(CurrentUserInterceptor)
  @ApiSkillBody(UpsertDepartmentRequestDto)
  async upsertDepartment(
    @CurrentUser() user: User,
    @Body() body: SkillPayloadDto,
  ): Promise<ResponseDTO> {
    const { campusId, departmentId } = plainToInstance(
      UpsertDepartmentRequestDto,
      body.action.clientExtra,
    );
    const template = await this.usersService.upsertDepartment(
      user.id,
      campusId,
      departmentId,
    );
    return new ResponseDTO(template);
  }
}
