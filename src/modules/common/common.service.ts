import { Injectable } from '@nestjs/common';
import { CampusRepository } from './repository/campus.repository';
import { CollegeRepository } from './repository/college.repository';
import { DepartmentRepository } from './repository/department.repository';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { ApiTags } from '@nestjs/swagger';
import { Button, ListItem } from 'src/common/interfaces/response/fields/etc';
import { BlockId, ListCardConfig } from 'src/common/utils/constants';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { createListCard } from 'src/common/utils/component';

@ApiTags('common')
@Injectable()
export class CommonService {
  constructor(
    private readonly campusRepository: CampusRepository,
    private readonly collegeRepository: CollegeRepository,
    private readonly departmentRepository: DepartmentRepository,
  ) {}

  async getCampusListCard(blockId: string): Promise<SkillTemplate> {
    const campusEntities = await this.campusRepository.findAll();

    const header: ListItem = {
      title: '캠퍼스 선택',
    };

    const items: ListItem[] = campusEntities.map((campusEntity) => {
      return {
        title: campusEntity.name,
        imageUrl: campusEntity.thumbnailUrl,
        action: 'block',
        blockId,
        extra: {
          campusId: campusEntity.id,
        },
      };
    });

    const campusListCard: ListCard = createListCard(header, items);

    return {
      outputs: [campusListCard],
    };
  }

  async getCollegeListCard(
    campusId: number,
    page: number = 1,
    blockId: string,
  ): Promise<SkillTemplate> {
    const [collegeEntities, total] = await this.collegeRepository.findAll(page);

    const header: ListItem = {
      title: '단과대학 선택',
    };

    const items: ListItem[] = collegeEntities.map((collegeEntity) => {
      return {
        title: collegeEntity.name,
        imageUrl: collegeEntity.thumbnailUrl,
        action: 'block',
        blockId,
        extra: {
          campusId: campusId,
          collegeId: collegeEntity.id,
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

  async getDepartmentListCard(
    campusId: number,
    collegeId: number,
    page: number = 1,
    blockId: string,
  ): Promise<SkillTemplate> {
    const [departmentEntities, total] =
      await this.departmentRepository.findByCollegeId(collegeId, page);

    const header: ListItem = {
      title: '학과 선택',
    };

    const items: ListItem[] = departmentEntities.map((departmentEntity) => {
      return {
        title: departmentEntity.name,
        action: 'block',
        blockId,
        extra: {
          campusId,
          departmentId: departmentEntity.id,
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
          collegeId: collegeId,
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
          collegeId: collegeId,
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
