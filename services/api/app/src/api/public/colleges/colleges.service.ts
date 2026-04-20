import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { College } from 'src/type-orm/entities/colleges/college.entity';
import { CollegesRepository } from 'src/type-orm/entities/colleges/colleges.repository';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';

@Injectable()
export class CollegesService {
  readonly logger = new Logger(CollegesService.name);

  constructor(
    private readonly collegesRepository: CollegesRepository,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  @CacheKey({
    key: ([page]) => `colleges:page:${page as number}`,
  })
  public findAll(page: number): Promise<[College[], number]> {
    return this.collegesRepository.findAll(page);
  }
}
