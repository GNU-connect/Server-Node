import { Injectable } from '@nestjs/common';
import { CampusRepository } from './repository/campus.repository';
import { createListCard } from 'src/common/utils/component';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { CollegeRepository } from './repository/college.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly campusRepository: CampusRepository,
    private readonly collegeRepository: CollegeRepository,
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
      };
    });

    const campusListCard: ListCard = createListCard(header, items);

    return {
      outputs: [campusListCard],
    };
  }

  async getCollegeListCard(campusId: number): Promise<SkillTemplate> {
    const collegeEntities = await this.collegeRepository.findByCampusId(
      campusId,
    );

    const header: ListItem = {
      title: '단과대학 선택',
    };

    const items: ListItem[] = collegeEntities.map((collegeEntity) => {
      return {
        title: collegeEntity.name,
        imageUrl: collegeEntity.thumbnail_url,
      };
    });

    const collegeListCard: ListCard = createListCard(header, items);

    return {
      outputs: [collegeListCard],
    };
  }
}
