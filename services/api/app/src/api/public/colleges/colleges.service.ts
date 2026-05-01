import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CollegeListResult } from 'src/api/public/colleges/dtos/results/college-list-result.dto';
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
  public async findAll(page: number): Promise<CollegeListResult> {
    const [colleges, total] = await this.collegesRepository.findAll(page);
    return { colleges, total };
  }
}
