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
    const capmusId = body.action.clientExtra['campusId'];
    const template = await this.userService.getCollegeListCard(capmusId);
    console.log(template);
    return new ResponseDTO(template);
  }

  @Post('get/department')
  async getDepartment(@Body() body: SkillPayload): Promise<ResponseDTO> {
    const collegeId = body.action.clientExtra['collegeId'];
    const template = await this.userService.getDepartmentListCard(collegeId);
    return new ResponseDTO(template);
  }
}
