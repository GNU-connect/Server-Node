import { Injectable } from '@nestjs/common';
import { CafeteriaNutritionalIngredientsRepository } from './repository/cafeteria_nutritional_ingredients.repository';
import { createSimpleText } from 'src/common/utils/component';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { SimpleText } from 'src/common/interfaces/response/fields/component';

@Injectable()
export class CafeteriaService {
  constructor(
    private readonly cafeteriaNutritionalIngredientsRepository: CafeteriaNutritionalIngredientsRepository,
  ) {}

  async getCafeteriaDietNutritionalIngredientsSimpleText(
    cafeteriaId: number,
    day: string,
    time: string,
  ): Promise<SkillTemplate> {
    const content =
      await this.cafeteriaNutritionalIngredientsRepository.findByTime(
        cafeteriaId,
        day,
        time,
      );

    const simpleText: SimpleText = createSimpleText(content[0].content);

    return {
      outputs: [simpleText],
    };
  }
}
