import { Body, Controller, Post } from '@nestjs/common';
import { CafeteriaService } from './cafeteria.service';
import { SkillPayload } from 'src/common/interfaces/request/skillPayload';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('cafeteria')
@Controller('cafeteria')
export class CafeteriaController {
  constructor(private readonly cafeteriaService: CafeteriaService) {}
  @Post('get/cafeteria-diet/nutritional-ingredients')
  async getCafeteriaDietNutritionalIngredients(
    @Body() body: SkillPayload,
  ): Promise<ResponseDTO> {
    const { clientExtra } = body.action;
    const cafeteriaId = clientExtra['cafeteriaId'];
    const date = clientExtra['date'];
    const time = clientExtra['time'];
    console.log(cafeteriaId, date, time);
    const template =
      await this.cafeteriaService.getCafeteriaDietNutritionalIngredientsSimpleText(
        cafeteriaId,
        date,
        time,
      );
    return new ResponseDTO(template);
  }
}
