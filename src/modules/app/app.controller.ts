import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseDTO } from '../../common/dto/response.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  getHello(): ResponseDTO {
    return this.appService.getHello();
  }
}
