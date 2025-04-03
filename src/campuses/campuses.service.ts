import { Injectable } from '@nestjs/common';
import { CampusesRepository } from 'src/campuses/repositories/campuses.repository';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { createListCard } from 'src/common/utils/component';

@Injectable()
export class CampusesService {
  constructor(private readonly campusesRepository: CampusesRepository) {}

  public async campusesListCard(blockId: string): Promise<SkillTemplate> {
    const campuses = await this.campusesRepository.findAll();

    const header: ListItem = {
      title: '캠퍼스 선택',
    };

    const items: ListItem[] = campuses.map((campus) => {
      return {
        title: campus.name,
        imageUrl: campus.thumbnailUrl,
        action: 'block',
        blockId,
        extra: {
          campusId: campus.id,
        },
      };
    });

    const campusListCard: ListCard = createListCard(header, items);

    return {
      outputs: [campusListCard],
    };
  }
}
