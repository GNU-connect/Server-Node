import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { DepartmentMessagesService } from 'src/api/public/message-templates/department-messages.service';
import { ListDepartmentsRequestDto } from 'src/api/public/users/dtos/requests/list-department-request.dto';
import { Department } from 'src/type-orm/entities/departments/department.entity';
import { DepartmentsRepository } from 'src/type-orm/entities/departments/departments.repository';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly departmentMessagesService: DepartmentMessagesService,
  ) {}

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
    return this.departmentsRepository.findByCollegeId(extra);
  }
}
