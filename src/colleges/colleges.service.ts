import { Injectable } from '@nestjs/common';
import { College } from 'src/colleges/entities/college.entity';
import { CollegesRepository } from 'src/colleges/repositories/colleges.repository';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { createListCard } from 'src/common/utils/component';
import { BlockId, ListCardConfig } from 'src/common/utils/constants';
import { CollegeMessagesService } from 'src/message-templates/college-messages.service';

@Injectable()
export class CollegesService {
  constructor(
    private readonly collegesRepository: CollegesRepository,
    private readonly collegeMessagesService: CollegeMessagesService,
  ) {}

  public async collegesListCard(
    campusId: number,
    page: number,
    blockId: string,
  ): Promise<SkillTemplate> {
    const [colleges, total] = await this.findAll(page);
    return this.collegeMessagesService.collegesListCard(
      colleges,
      total,
      campusId,
      page,
      blockId,
    );
  }

  private findAll(page: number): Promise<[College[], number]> {
    return this.collegesRepository.findAll(page);
  }
}
