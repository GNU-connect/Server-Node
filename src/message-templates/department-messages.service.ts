import { Injectable } from '@nestjs/common';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { createListCard } from 'src/common/utils/component';
import { BlockId, ListCardConfig } from 'src/common/utils/constants';
import { Department } from 'src/departments/entities/department.entity';
import { ListDepartmentsRequestDto } from 'src/users/dtos/requests/list-department-request.dto';

@Injectable()
export class DepartmentMessagesService {
  public async departmentsListCard(
    departments: Department[],
    total: number,
    extra: ListDepartmentsRequestDto,
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
          campusId: extra.campusId,
          departmentId: department.id,
        },
      };
    });

    const departmentListCard: ListCard = createListCard(header, items);

    const totalPages = Math.ceil(total / ListCardConfig.LIMIT);
    const paginationButtons = [];

    if (extra.page > 1) {
      paginationButtons.push({
        label: '이전',
        action: 'block',
        blockId: BlockId.DEPARTMENT_LIST,
        extra: {
          campusId: extra.campusId,
          collegeId: extra.collegeId,
          page: extra.page - 1,
        },
      });
    }

    if (extra.page < totalPages) {
      paginationButtons.push({
        label: '다음',
        action: 'block',
        blockId: BlockId.DEPARTMENT_LIST,
        extra: {
          campusId: extra.campusId,
          collegeId: extra.collegeId,
          page: extra.page + 1,
        },
      });
    }

    return {
      outputs: [departmentListCard],
      quickReplies: paginationButtons,
    };
  }
}
