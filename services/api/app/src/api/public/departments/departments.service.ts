import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { DepartmentMessagesService } from 'src/api/public/message-templates/department-messages.service';
import { ListDepartmentsRequestDto } from 'src/api/public/users/dtos/requests/list-department-request.dto';
import { Department } from 'src/type-orm/entities/departments/department.entity';
import { DepartmentsRepository } from 'src/type-orm/entities/departments/departments.repository';
import { CacheKey } from 'src/api/common/decorators/cache-key.decorator';

@Injectable()
export class DepartmentsService {
  readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly departmentMessagesService: DepartmentMessagesService,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  @CacheKey({
    key: ([blockId]) => `departments:${blockId}`,
  })
  public async departmentsListCard(
    extra: ListDepartmentsRequestDto,
    blockId: string,
  ): Promise<SkillTemplate> {
    const [departments, total] = await this.findAll(extra);
    return this.departmentMessagesService.departmentsListCard(
      departments,
      total,
      extra,
      blockId,
    );
  }

  private findAll(
    extra: ListDepartmentsRequestDto,
  ): Promise<[Department[], number]> {
    return this.departmentsRepository.findByCollegeId(
      extra.collegeId,
      extra.page,
    );
  }
}
