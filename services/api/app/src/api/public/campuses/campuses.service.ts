import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { CampusMessagesService } from 'src/api/public/message-templates/campus-messages.service';
import { Campus } from 'src/type-orm/entities/campuses/campus.entity';
import { CampusesRepository } from 'src/type-orm/entities/campuses/campuses.repository';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';

@Injectable()
export class CampusesService {
  readonly logger = new Logger(CampusesService.name);

  constructor(
    private readonly campusesRepository: CampusesRepository,
    private readonly campusMessagesService: CampusMessagesService,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  @CacheKey({
    key: ([blockId]) => `campuses:${blockId}`,
  })
  public async campusesListCard(blockId: string): Promise<SkillTemplate> {
    const campuses = await this.findAll();
    return this.campusMessagesService.createCampusListCard(campuses, blockId);
  }

  private findAll(): Promise<Campus[]> {
    return this.campusesRepository.findAll();
  }
}
