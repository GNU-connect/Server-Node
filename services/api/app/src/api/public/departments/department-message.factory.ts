import { Injectable } from '@nestjs/common';
import { ListCard } from 'src/api/common/interfaces/response/fields/component';
import { ListItem } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createListCard } from 'src/api/common/utils/component';
import { BlockId, ListCardConfig } from 'src/api/common/utils/constants';
import { DepartmentListResult } from 'src/api/public/departments/dtos/results/department-list-result.dto';
import { ListDepartmentsRequestDto } from 'src/api/public/users/dtos/requests/list-department-request.dto';

@Injectable()
export class DepartmentMessageFactory {
  public createDepartmentListCard(
    result: DepartmentListResult,
    extra: ListDepartmentsRequestDto,
    blockId: string,
  ): SkillTemplate {
    const header: ListItem = {
      title: '학과 선택',
    };

    const items: ListItem[] = result.departments.map(department => {
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

    const totalPages = Math.ceil(result.total / ListCardConfig.LIMIT);
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
