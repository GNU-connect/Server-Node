import { Injectable } from '@nestjs/common';
import { ListCard } from 'src/api/common/interfaces/response/fields/component';
import { ListItem } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createListCard } from 'src/api/common/utils/component';
import { CampusListResult } from 'src/api/public/campuses/dtos/results/campus-list-result.dto';

@Injectable()
export class CampusMessageFactory {
  createCampusListCard(result: CampusListResult, blockId: string): SkillTemplate {
    const header: ListItem = {
      title: '캠퍼스 선택',
    };

    const items: ListItem[] = result.campuses.map(campus => ({
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
