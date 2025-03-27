import { Body, Controller, Post, Req, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { ResponseDTO } from 'src/common/dtos/response.dto';
import { ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/common/utils/constants';
import { SkillPayloadDto } from 'src/common/dtos/requests/skill-payload.dto';
import { plainToInstance } from 'class-transformer';
import { ApiSkillBody } from 'src/common/decorators/api-skill-body.decorator';
import { UpsertDepartmentRequestDto } from './dtos/requests/upsert-department-request.dto';
import { ListDepartmentsRequestDto } from './dtos/requests/list-department-request.dto';
import { ListCollegesRequestDto } from './dtos/requests/list-college-request.dto';
import { User } from './entities/users.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
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
    const template = await this.commonService.campusesListCard(blockId);
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
    const template = await this.commonService.collegesListCard(
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
    const template = await this.commonService.departmentsListCard(
      campusId,
      collegeId,
      page,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('department/upsert')
  @ApiSkillBody(UpsertDepartmentRequestDto)
  async upsertDepartment(
    @Req() req: Request,
    @Body() body: SkillPayloadDto,
  ): Promise<ResponseDTO> {
    const userId = req['userId'];
    const { campusId, departmentId } = plainToInstance(
      UpsertDepartmentRequestDto,
      body.action.clientExtra,
    );
    const template = await this.usersService.upsertDepartment(
      userId,
      campusId,
      departmentId,
    );
    return new ResponseDTO(template);
  }
}
