import { Injectable } from '@nestjs/common';
import { ListCard } from 'src/api/common/interfaces/response/fields/component';
import {
  Button,
  ListItem,
} from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createListCard } from 'src/api/common/utils/component';
import { BlockId } from 'src/api/common/utils/constants';
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
}
