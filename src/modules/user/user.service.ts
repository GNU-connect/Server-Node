import { Injectable } from '@nestjs/common';
import { CampusRepository } from './repository/campus.repository';
import { createListCard } from 'src/common/utils/component';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { CollegeRepository } from './repository/college.repository';
import { DepartmentRepository } from './repository/department.repository';
import { BlockId, ListCardConfig } from 'src/common/utils/constants';

@Injectable()
export class UserService {
  constructor(
    private readonly campusRepository: CampusRepository,
    private readonly collegeRepository: CollegeRepository,
    private readonly departmentRepository: DepartmentRepository,
  ) {}

  async getCampusListCard(): Promise<SkillTemplate> {
    const campusEntities = await this.campusRepository.findAll();

    const header: ListItem = {
      title: '캠퍼스 선택',
    };

    const items: ListItem[] = campusEntities.map((campusEntity) => {
      return {
        title: campusEntity.name,
        imageUrl: campusEntity.thumbnail_url,
        action: 'block',
        blockId: BlockId.COLLEGE_LIST,
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
  ): Promise<SkillTemplate> {
    const [collegeEntities, total] =
      await this.collegeRepository.findByCampusId(campusId, page);

    const header: ListItem = {
      title: '단과대학 선택',
    };

    const items: ListItem[] = collegeEntities.map((collegeEntity) => {
      return {
        title: collegeEntity.name,
        imageUrl: collegeEntity.thumbnail_url,
        action: 'block',
        blockId: BlockId.DEPARTMENT_LIST,
        extra: {
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
        blockId: BlockId.COLLEGE_LIST, // 실제 blockId로 변경 필요
        extra: {
          page: page - 1,
        },
      });
    }

    if (page < totalPages) {
      paginationButtons.push({
        label: '다음',
        action: 'block',
        blockId: BlockId.COLLEGE_LIST, // 실제 blockId로 변경 필요
        extra: {
          page: page + 1,
        },
      });
    }

    return {
      outputs: [collegeListCard],
      quickReplies: paginationButtons,
    };
  }

  async getDepartmentListCard(collegeId: number): Promise<SkillTemplate> {
    const departmentEntities = await this.departmentRepository.findByCollegeId(
      collegeId,
    );

    const header: ListItem = {
      title: '학과 선택',
    };

    const items: ListItem[] = departmentEntities.map((departmentEntity) => {
      return {
        title: departmentEntity.name,
      };
    });

    const departmentListCard: ListCard = createListCard(header, items);

    return {
      outputs: [departmentListCard],
    };
  }
}
