import { Injectable } from '@nestjs/common';
import { ListCard } from 'src/common/interfaces/response/fields/component';
import { ListItem } from 'src/common/interfaces/response/fields/etc';
import { SkillTemplate } from 'src/common/interfaces/response/fields/template';
import { createListCard } from 'src/common/utils/component';
import { BlockId, ListCardConfig } from 'src/common/utils/constants';
import { Department } from 'src/departments/entities/department.entity';
import { DepartmentsRepository } from 'src/departments/repositories/departments.repository';
import { DepartmentMessagesService } from 'src/message-templates/department-messages.service';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly departmentMessagesService: DepartmentMessagesService,
  ) {}

  public async departmentsListCard(
    campusId: number,
    collegeId: number,
    page: number,
    blockId: string,
  ): Promise<SkillTemplate> {
    const [departments, total] = await this.findAll(collegeId, page);
    return this.departmentMessagesService.departmentsListCard(
      departments,
      total,
      campusId,
      collegeId,
      page,
      blockId,
    );
  }

  private findAll(
    collegeId: number,
    page: number,
  ): Promise<[Department[], number]> {
    return this.departmentsRepository.findByCollegeId(collegeId, page);
  }
}
