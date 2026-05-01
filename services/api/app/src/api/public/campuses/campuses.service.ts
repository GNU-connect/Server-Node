import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CampusListResult } from 'src/api/public/campuses/dtos/results/campus-list-result.dto';
import { CampusesRepository } from 'src/type-orm/entities/campuses/campuses.repository';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';

@Injectable()
export class CampusesService {
  readonly logger = new Logger(CampusesService.name);

  constructor(
    private readonly campusesRepository: CampusesRepository,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  @CacheKey({
    key: () => 'campuses',
  })
  public async findAll(): Promise<CampusListResult> {
    const campuses = await this.campusesRepository.findAll();
    return {
      campuses: campuses.map(campus => ({
        id: campus.id,
        name: campus.name,
        thumbnailUrl: campus.thumbnailUrl,
      })),
    };
  }
}
