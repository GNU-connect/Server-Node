import { Injectable } from '@nestjs/common';
import { CampusesRepository } from './repositories/campuses.repository';
import { CollegesRepository } from './repositories/colleges.repository';
import { DepartmentsRepository } from './repositories/departments.repository';
import { SkillTemplate } from 'src/modules/common/interfaces/response/fields/template';
import { ApiTags } from '@nestjs/swagger';
import { ListItem } from 'src/modules/common/interfaces/response/fields/etc';
import { BlockId, ListCardConfig } from 'src/modules/common/utils/constants';
import { ListCard } from 'src/modules/common/interfaces/response/fields/component';
import { createListCard } from 'src/modules/common/utils/component';

@ApiTags('common')
@Injectable()
export class CommonService {
  constructor(
    private readonly campusesRepository: CampusesRepository,
    private readonly collegesRepository: CollegesRepository,
    private readonly departmentsRepository: DepartmentsRepository,
  ) {}

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

  public async departmentsListCard(
    campusId: number,
    collegeId: number,
    page: number = 1,
    blockId: string,
  ): Promise<SkillTemplate> {
    const [departments, total] =
      await this.departmentsRepository.findByCollegeId(collegeId, page);

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
