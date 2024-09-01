import { Module } from '@nestjs/common';
import { CafeteriaService } from './cafeteria.service';
import { CafeteriaController } from './cafeteria.controller';

@Module({
  controllers: [CafeteriaController],
  providers: [CafeteriaService]
})
export class CafeteriaModule {}
