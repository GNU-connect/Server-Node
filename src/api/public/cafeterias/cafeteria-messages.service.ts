import { Injectable } from '@nestjs/common';
import {
  BasicCard,
  ListCard,
} from 'src/api/common/interfaces/response/fields/component';
import {
  Button,
  ListItem,
  QuickReply,
} from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import {
  createBasicCard,
  createListCard,
} from 'src/api/common/utils/component';
import { BlockId } from 'src/api/common/utils/constants';
import {
  DietDate,
  DietTime,
} from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { getDayWeek } from 'src/api/public/cafeterias/utils/time';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';

@Injectable()
export class CafeteriaMessagesService {
  public cafeteriasListCard(cafeterias: Cafeteria[]): SkillTemplate {
    const header: ListItem = {
      title: '어떤 교내 식당 정보가 알고 싶어?',
    };

    const items: ListItem[] = cafeterias.map((cafeteria) => ({
      title: cafeteria.name,
      description: cafeteria.campus.name,
      imageUrl: cafeteria.thumbnailUrl,
      action: 'block',
      blockId: BlockId.CAFETERIA_DIET_LIST,
      extra: {
        cafeteriaId: cafeteria.id,
      },
    }));

    const buttons: Button[] = [
      {
        label: '더보기',
        action: 'block',
        blockId: BlockId.CAFETERIA_LIST,
        extra: {
          campusId: -1,
        },
      },
    ];

    const cafeteriaDietListCard: ListCard = createListCard(
      header,
      items,
      buttons,
    );

    return {
      outputs: [cafeteriaDietListCard],
    };
  }

  public cafeteriaDietsListCard(
    cafeteria: Cafeteria,
    date: Date,
    time: DietTime,
    diets: CafeteriaDiet[],
  ): SkillTemplate {
    const title = `🍱 ${cafeteria.name}(${cafeteria.campus.name.slice(0, 2)})`;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let description = `${year}-${month}-${day}(${getDayWeek(
      date,
    )}) ${time} 메뉴\n\n`;

    if (diets.length > 0) {
      // dishCategory 또는 dishType 별로 그룹화
      const grouped: Record<string, string[]> = {};
      diets.forEach((diet) => {
        const type = diet.dishCategory || diet.dishType || '';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(diet.dishName);
      });

      // 출력
      description += Object.entries(grouped)
        .map(([type, names]) => {
          if (type) {
            return `[${type}]\n${names.join('\n')}`;
          } else {
            return names.join('\n');
          }
        })
        .join('\n\n');
    } else {
      description += '메뉴가 없습니다.';
    }

    const basicCard: BasicCard = createBasicCard(title, description, {
      imageUrl: cafeteria.thumbnailUrl,
    });

    const quickReplies: QuickReply[] =
      this.createDishDateQuickReplies(cafeteria);

    return {
      outputs: [basicCard],
      quickReplies,
    };
  }

  private createDishDateQuickReplies(cafeteria: Cafeteria): QuickReply[] {
    const dishDateTypes: DietDate[] = ['오늘', '내일'];
    const times: DietTime[] = ['아침', '점심', '저녁'];

    return dishDateTypes.flatMap((dishDateType) =>
      times.map((time) => ({
        label: `${dishDateType} ${time}`,
        action: 'block',
        blockId: BlockId.CAFETERIA_DIET_LIST,
        extra: {
          cafeteriaId: cafeteria.id,
          date: dishDateType,
          time,
        },
      })),
    );
  }
}
