import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { CampusMessagesService } from 'src/api/public/message-templates/campus-messages.service';
import { Campus } from 'src/type-orm/entities/campuses/campus.entity';
import { CampusesRepository } from 'src/type-orm/entities/campuses/campuses.repository';

@Injectable()
export class CampusesService {
  constructor(
    private readonly campusesRepository: CampusesRepository,
    private readonly campusMessagesService: CampusMessagesService,
  ) {}

  public async campusesListCard(blockId: string): Promise<SkillTemplate> {
    const campuses = await this.findAll();
    return this.campusMessagesService.createCampusListCard(campuses, blockId);
  }

  private findAll(): Promise<Campus[]> {
    return this.campusesRepository.findAll();
  }
}
