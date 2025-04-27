import { Injectable } from '@nestjs/common';
import { ListCard } from 'src/api/common/interfaces/response/fields/component';
import { ListItem } from 'src/api/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { createListCard } from 'src/api/common/utils/component';
import { BlockId, ListCardConfig } from 'src/api/common/utils/constants';
import { ListDepartmentsRequestDto } from 'src/api/public/users/dtos/requests/list-department-request.dto';
import { Department } from 'src/type-orm/entities/departments/department.entity';

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
