import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CollegeListResult } from 'src/api/public/colleges/application/dtos/results/college-list-result.dto';
import { CollegesRepository } from 'src/api/public/colleges/infrastructure/colleges.repository';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';

@Injectable()
export class CollegesService {
  readonly logger = new Logger(CollegesService.name);

  constructor(
    private readonly collegesRepository: CollegesRepository,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  @CacheKey({
    key: ([page, pageSize]) =>
      `colleges:page:${Math.max(page as number, 1)}:size:${pageSize as number}`,
  })
  public async findAll(page: number, pageSize: number): Promise<CollegeListResult> {
    const safePage = Math.max(page, 1);
    const [colleges, total] = await this.collegesRepository.findAll(safePage, pageSize);
    return {
      colleges: colleges.map(college => ({
        id: college.id,
        name: college.name,
        thumbnailUrl: college.thumbnailUrl,
      })),
      total,
    };
  }
}
