import { Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseDTO } from 'src/common/dto/response.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register/department')
  registerDepartment(): any {
    //return this.userService.registerDepartment();
  }
}
