import { Injectable } from '@nestjs/common';
import { College } from 'src/colleges/entities/college.entity';
import { CollegesRepository } from 'src/colleges/repositories/colleges.repository';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
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
