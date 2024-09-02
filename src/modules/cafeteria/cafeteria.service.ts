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
    date: Date,
    time: string,
  ): Promise<SkillTemplate> {
    const content =
      await this.cafeteriaNutritionalIngredientsRepository.findByTime(
        cafeteriaId,
        date,
        time,
      );

    if (content.length === 0) {
      return {
        outputs: [
          createSimpleText(
            '아직 영양성분 정보가 업데이트 되지 않았어. 조금만 기다려줘!',
          ),
        ],
      };
    }

    const simpleText: SimpleText = createSimpleText(content[0].content);

    return {
      outputs: [simpleText],
    };
  }
}
