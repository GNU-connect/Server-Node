import { Body, Controller, Post } from '@nestjs/common';
import { CafeteriaService } from './cafeteria.service';
import { SkillPayload } from 'src/common/interfaces/request/skillPayload';
import { ResponseDTO } from 'src/common/dto/response.dto';

@Controller('cafeteria')
export class CafeteriaController {
  constructor(private readonly cafeteriaService: CafeteriaService) {}
  @Post('get/cafeteria-diet/nutritional-ingredients')
  async getCafeteriaDietNutritionalIngredients(
    @Body() body: SkillPayload,
  ): Promise<ResponseDTO> {
    // const { clientExtra } = body.action;
    // const cafeteriaId = clientExtra['cafeteriaId'];
    // const day = clientExtra['day'];
    // const time = clientExtra['time'];
    const cafeteriaId = 1;
    const day = '월';
    const time = '아침';
    const template =
      await this.cafeteriaService.getCafeteriaDietNutritionalIngredientsSimpleText(
        cafeteriaId,
        day,
        time,
      );
    return new ResponseDTO(template);
  }
}
