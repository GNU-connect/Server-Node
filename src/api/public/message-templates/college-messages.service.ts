import { Injectable } from '@nestjs/common';
import { ListCard } from 'src/api/common/interfaces/response/fields/component';
import { ListItem } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createListCard } from 'src/api/common/utils/component';
import { BlockId, ListCardConfig } from 'src/api/common/utils/constants';
import { College } from 'src/type-orm/entities/colleges/college.entity';

@Injectable()
export class CollegeMessagesService {
  public collegesListCard(
    colleges: College[],
    total: number,
    campusId: number,
    page: number,
    blockId: string,
  ): SkillTemplate {
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
