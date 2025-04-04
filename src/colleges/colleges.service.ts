import { Injectable } from '@nestjs/common';
import { College } from 'src/colleges/entities/college.entity';
import { CollegesRepository } from 'src/colleges/repositories/colleges.repository';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { createListCard } from 'src/common/utils/component';
import { BlockId, ListCardConfig } from 'src/common/utils/constants';
import { CollegeMessagesService } from 'src/message-templates/college-messages.service';
import { ListCollegesRequestDto } from 'src/users/dtos/requests/list-college-request.dto';

@Injectable()
export class CollegesService {
  constructor(
    private readonly collegesRepository: CollegesRepository,
    private readonly collegeMessagesService: CollegeMessagesService,
  ) {}

  public async collegesListCard(
    extra: ListCollegesRequestDto,
    blockId: string,
  ): Promise<SkillTemplate> {
    const [colleges, total] = await this.findAll(extra.page);
    return this.collegeMessagesService.collegesListCard(
      colleges,
      total,
      extra.campusId,
      extra.page,
      blockId,
    );
  }

  private findAll(page: number): Promise<[College[], number]> {
    return this.collegesRepository.findAll(page);
  }
}
