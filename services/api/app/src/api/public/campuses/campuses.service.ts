import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Campus } from 'src/type-orm/entities/campuses/campus.entity';
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
  public findAll(): Promise<Campus[]> {
    return this.campusesRepository.findAll();
  }
}
