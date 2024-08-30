import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { SkillPayload } from 'src/common/interfaces/request/skillPayload';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('get/campus')
  async getCampus(): Promise<ResponseDTO> {
    const template = await this.userService.getCampusListCard();
    return new ResponseDTO(template);
  }

  @Post('get/college')
  async getCollege(@Body() body: SkillPayload): Promise<ResponseDTO> {
    const { clientExtra } = body.action;
    const capmusId = clientExtra['campusId'];
    const page = clientExtra['page'];
    const template = await this.userService.getCollegeListCard(capmusId, page);
    return new ResponseDTO(template);
  }

  @Post('get/department')
  async getDepartment(@Body() body: SkillPayload): Promise<ResponseDTO> {
    const { clientExtra } = body.action;
    const collegeId = clientExtra['collegeId'];
    const page = clientExtra['page'];
    const template = await this.userService.getDepartmentListCard(
      collegeId,
      page,
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
