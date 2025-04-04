import { Injectable } from '@nestjs/common';
import { Campus } from 'src/campuses/entities/campus.entity';
import { CampusesRepository } from 'src/campuses/repositories/campuses.repository';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { CampusMessagesService } from 'src/message-templates/campus-messages.service';

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
