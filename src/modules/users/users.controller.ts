import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ResponseDTO } from 'src/modules/common/dtos/response.dto';
import { ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/modules/common/utils/constants';
import { SkillPayloadDto } from 'src/modules/common/dtos/request/skill-payload.dto';
import { plainToInstance } from 'class-transformer';
import { ApiSkillBody } from 'src/modules/common/decorators/api-skill-body.decorator';
import { UpsertDepartmentRequestDto } from './dtos/request/upsert-department-request.dto';
import { ListDepartmentsRequestDto } from './dtos/request/list-department-request.dto';
import { ListCollegesRequestDto } from './dtos/request/list-college-request.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
  ) {}

  @Post('get')
  async getUserProfile(@Req() req: Request): Promise<ResponseDTO> {
    const userId = req['userId'];
    const template = await this.usersService.getUserProfile(userId);
    return new ResponseDTO(template);
  }

  @Post('campuses/list')
  async getCampuses(): Promise<ResponseDTO> {
    const blockId = BlockId.COLLEGE_LIST;
    const template = await this.commonService.getCampusListCard(blockId);
    return new ResponseDTO(template);
  }
  
  @Post('colleges/list')
  @ApiSkillBody(ListCollegesRequestDto)
  async getColleges(@Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const { campusId, page } = plainToInstance(ListCollegesRequestDto, body.action.clientExtra);
    const blockId = BlockId.DEPARTMENT_LIST;
    const template = await this.commonService.getCollegeListCard(
      campusId,
      page,
      blockId,
    );
    console.log(template.quickReplies);
    return new ResponseDTO(template);
  }

  @Post('departments/list')
  @ApiSkillBody(ListDepartmentsRequestDto)
  async getDepartments(@Body() body: SkillPayloadDto): Promise<ResponseDTO> {
    const { campusId, collegeId, page } = plainToInstance(ListDepartmentsRequestDto, body.action.clientExtra);
    const blockId = BlockId.UPDATE_DEPARTMENT;
    const template = await this.commonService.getDepartmentListCard(
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
    const template = await this.usersService.upsertUserDepartment(
      userId,
      campusId,
      departmentId,
    );
    return new ResponseDTO(template);
  }
}
