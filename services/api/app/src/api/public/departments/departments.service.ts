import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DepartmentListResult } from 'src/api/public/departments/dtos/results/department-list-result.dto';
import { DepartmentsRepository } from 'src/api/public/departments/departments.repository';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';

@Injectable()
export class DepartmentsService {
  readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  @CacheKey({
    key: ([collegeId, page]) => {
      return `departments:college:${collegeId}:page:${page}`;
    },
  })
  public async findAll(collegeId: number, page: number): Promise<DepartmentListResult> {
    const [departments, total] = await this.departmentsRepository.findByCollegeId(collegeId, page);
    return {
      departments: departments.map(department => ({
        id: department.id,
        name: department.name,
      })),
      total,
    };
  }
}
