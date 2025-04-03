import { Injectable } from '@nestjs/common';
import { CollegesRepository } from 'src/colleges/repositories/colleges.repository';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { createListCard } from 'src/common/utils/component';
import { BlockId, ListCardConfig } from 'src/common/utils/constants';

@Injectable()
export class CollegesService {
  constructor(private readonly collegesRepository: CollegesRepository) {}

  public async collegesListCard(
    campusId: number,
    page: number,
    blockId: string,
  ): Promise<SkillTemplate> {
    const [colleges, total] = await this.collegesRepository.findAll(page);

    const header: ListItem = {
      title: '단과대학 선택',
    };

    const items: ListItem[] = colleges.map((college) => {
      return {
        title: college.name,
        imageUrl: college.thumbnailUrl,
        action: 'block',
        blockId,
        extra: {
          campusId: campusId,
          collegeId: college.id,
        },
      };
    });

    const collegeListCard: ListCard = createListCard(header, items);

    const totalPages = Math.ceil(total / ListCardConfig.LIMIT);
    const paginationButtons = [];

    if (page > 1) {
      paginationButtons.push({
        label: '이전',
        action: 'block',
        blockId: BlockId.COLLEGE_LIST,
        extra: {
          campusId: campusId,
          page: page - 1,
        },
      });
    }

    if (page < totalPages) {
      paginationButtons.push({
        label: '다음',
        action: 'block',
        blockId: BlockId.COLLEGE_LIST,
        extra: {
          campusId: campusId,
          page: page + 1,
        },
      });
    }

    return {
      outputs: [collegeListCard],
      quickReplies: paginationButtons,
    };
  }
}
