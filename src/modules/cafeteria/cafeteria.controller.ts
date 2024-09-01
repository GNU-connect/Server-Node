import { Body, Controller, Post } from '@nestjs/common';
import { CafeteriaService } from './cafeteria.service';
import { SkillPayload } from 'src/common/interfaces/request/skillPayload';

@Controller('cafeteria')
export class CafeteriaController {
  constructor(private readonly cafeteriaService: CafeteriaService) {}
  @Post('get/cafeteria-diet/nutritional-ingredients')
  async getCafeteriaDietNutritionalIngredients(
    @Body() body: SkillPayload,
  ): Promise<any> {
    // const { clientExtra } = body.action;
    // const cafeteriaId = clientExtra['cafeteriaId'];
    // const day = clientExtra['day'];
    // const time = clientExtra['time'];
    // const template =
    //   await this.cafeteriaService.getCafeteriaDietNutritionalIngredientsSimpleText(
    //     cafeteriaId,
    //     day,
    //     time,
    //   );
  }
}
