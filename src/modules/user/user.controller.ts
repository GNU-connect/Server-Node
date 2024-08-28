import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { SkillPayload } from 'src/common/interfaces/request/skillPayload';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('get/campus')
  async getCampus(@Body() body: SkillPayload): Promise<ResponseDTO> {
    const template = await this.userService.getCampusListCard();
    return new ResponseDTO(template);
  }

  @Post('get/college')
  async getCollege(@Body() body: SkillPayload): Promise<any> {
    const capmusId = 1;
    const template = await this.userService.getCollegeListCard(capmusId);
    return new ResponseDTO(template);
  }

  @Post('register/department')
  registerDepartment(): any {
    //return this.userService.registerDepartment();
  }
}
