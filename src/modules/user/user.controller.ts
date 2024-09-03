import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { SkillPayload } from 'src/common/interfaces/request/skillPayload';
import { ApiTags } from '@nestjs/swagger';
import { CommonService } from '../common/common.service';
import { BlockId } from 'src/common/utils/constants';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly commonService: CommonService,
  ) {}

  @Post('get/campus')
  async getCampus(): Promise<ResponseDTO> {
    const blockId = BlockId.COLLEGE_LIST;
    const template = await this.commonService.getCampusListCard(blockId);
    return new ResponseDTO(template);
  }

  @Post('get/college')
  async getCollege(@Body() body: SkillPayload): Promise<ResponseDTO> {
    const { clientExtra } = body.action;
    const capmusId = clientExtra['campusId'];
    const page = clientExtra['page'];
    const blockId = BlockId.DEPARTMENT_LIST;
    const template = await this.commonService.getCollegeListCard(
      capmusId,
      page,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('get/department')
  async getDepartment(@Body() body: SkillPayload): Promise<ResponseDTO> {
    const { clientExtra } = body.action;
    const collegeId = clientExtra['collegeId'];
    const page = clientExtra['page'];
    const blockId = BlockId.UPDATE_DEPARTMENT;
    const template = await this.commonService.getDepartmentListCard(
      collegeId,
      page,
      blockId,
    );
    return new ResponseDTO(template);
  }

  @Post('update/department')
  async upsertUserDepartment(@Body() body: SkillPayload): Promise<ResponseDTO> {
    const userId = body.userRequest.user.id;
    const { clientExtra } = body.action;
    const departmentId = clientExtra['departmentId'];
    const template = await this.userService.upsertUserDepartment(
      userId,
      departmentId,
    );
    return new ResponseDTO(template);
  }
}
