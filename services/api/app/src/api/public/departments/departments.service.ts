import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ListDepartmentsRequestDto } from 'src/api/public/users/dtos/requests/list-department-request.dto';
import { Department } from 'src/type-orm/entities/departments/department.entity';
import { DepartmentsRepository } from 'src/type-orm/entities/departments/departments.repository';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';

@Injectable()
export class DepartmentsService {
  readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  @CacheKey({
    key: ([extra]) => {
      const { collegeId, page } = extra as ListDepartmentsRequestDto;
      return `departments:college:${collegeId}:page:${page}`;
    },
  })
  public findAll(extra: ListDepartmentsRequestDto): Promise<[Department[], number]> {
    return this.departmentsRepository.findByCollegeId(extra.collegeId, extra.page);
  }
}
