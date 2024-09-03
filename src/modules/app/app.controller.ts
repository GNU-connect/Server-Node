import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseDTO } from '../../common/dto/response.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
