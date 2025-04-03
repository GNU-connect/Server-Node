import { Injectable } from '@nestjs/common';
import { Department } from 'src/departments/entities/department.entity';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { createListCard } from 'src/common/utils/component';
import { BlockId, ListCardConfig } from 'src/common/utils/constants';

@Injectable()
export class DepartmentMessagesService {
  public async departmentsListCard(
    departments: Department[],
    total: number,
    campusId: number,
    collegeId: number,
    page: number,
    blockId: string,
  ): Promise<SkillTemplate> {
    const header: ListItem = {
      title: '학과 선택',
    };

    const items: ListItem[] = departments.map((department) => {
      return {
        title: department.name,
        action: 'block',
        blockId,
        extra: {
          campusId,
          departmentId: department.id,
        },
      };
    });

    const departmentListCard: ListCard = createListCard(header, items);

    const totalPages = Math.ceil(total / ListCardConfig.LIMIT);
    const paginationButtons = [];

    if (page > 1) {
      paginationButtons.push({
        label: '이전',
        action: 'block',
        blockId: BlockId.DEPARTMENT_LIST,
        extra: {
          campusId,
          collegeId,
          page: page - 1,
        },
      });
    }

    if (page < totalPages) {
      paginationButtons.push({
        label: '다음',
        action: 'block',
        blockId: BlockId.DEPARTMENT_LIST,
        extra: {
          campusId,
          collegeId,
          page: page + 1,
        },
      });
    }

    return {
      outputs: [departmentListCard],
      quickReplies: paginationButtons,
    };
  }
}
