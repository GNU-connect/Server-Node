import { Controller } from '@nestjs/common';
import { CafeteriaService } from './cafeteria.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('cafeteria')
@Controller('cafeteria')
export class CafeteriaController {
  constructor(private readonly cafeteriaService: CafeteriaService) {}
}
