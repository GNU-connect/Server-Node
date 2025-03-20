import { Body, Controller, Post, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { ResponseDTO } from 'src/modules/common/dtos/response.dto';
import { ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/modules/common/utils/constants';
import { SkillPayloadDto } from 'src/modules/common/dtos/requests/skill-payload.dto';
import { plainToInstance } from 'class-transformer';
import { ApiSkillBody } from 'src/modules/common/decorators/api-skill-body.decorator';
import { UpsertDepartmentRequestDto } from './dtos/requests/upsert-department-request.dto';
import { ListDepartmentsRequestDto } from './dtos/requests/list-department-request.dto';
import { ListCollegesRequestDto } from './dtos/requests/list-college-request.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
  ) {}

  @Post('profile/get')
  async getProfile(@Req() req: Request): Promise<ResponseDTO> {
    const userId = req['userId'];
    const template = await this.usersService.profileTextCard(userId);
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
    const { campusId, page } = plainToInstance(ListCollegesRequestDto, body.action.clientExtra);
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
    const { campusId, collegeId, page } = plainToInstance(ListDepartmentsRequestDto, body.action.clientExtra);
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
  async upsertDepartment(@Req() req: Request, @Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const userId = req['userId'];
    const { campusId, departmentId } = plainToInstance(UpsertDepartmentRequestDto, body.action.clientExtra);
    const template = await this.usersService.upsertDepartment(
      userId,
      campusId,
      departmentId,
    );
    return new ResponseDTO(template);
  }
}
