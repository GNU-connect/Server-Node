import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseDTO } from '../../common/dto/response.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/debug-sentry')
  getError() {
    throw new Error('My first Sentry error!');
  }
}
