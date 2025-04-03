import { Injectable } from '@nestjs/common';
import { Campus } from 'src/campuses/entities/campus.entity';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { createListCard } from 'src/common/utils/component';

@Injectable()
export class CampusMessagesService {
  createCampusListCard(campuses: Campus[], blockId: string): SkillTemplate {
    const header: ListItem = {
      title: '캠퍼스 선택',
    };

    const items: ListItem[] = campuses.map((campus) => ({
      title: campus.name,
      imageUrl: campus.thumbnailUrl,
      action: 'block',
      blockId,
      extra: {
        campusId: campus.id,
      },
    }));

    const campusListCard: ListCard = createListCard(header, items);

    return {
      outputs: [campusListCard],
    };
  }
}
