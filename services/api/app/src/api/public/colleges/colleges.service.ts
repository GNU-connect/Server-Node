import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { CollegeMessagesService } from 'src/api/public/message-templates/college-messages.service';
import { ListCollegesRequestDto } from 'src/api/public/users/dtos/requests/list-college-request.dto';
import { College } from 'src/type-orm/entities/colleges/college.entity';
import { CollegesRepository } from 'src/type-orm/entities/colleges/colleges.repository';

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
