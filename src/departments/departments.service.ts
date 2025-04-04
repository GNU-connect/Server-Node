import { Injectable } from '@nestjs/common';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { Department } from 'src/departments/entities/department.entity';
import { DepartmentsRepository } from 'src/departments/repositories/departments.repository';
import { DepartmentMessagesService } from 'src/message-templates/department-messages.service';
import { ListDepartmentsRequestDto } from 'src/users/dtos/requests/list-department-request.dto';

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
