import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListCardConfig } from 'src/api/common/utils/constants';
import { Department } from 'src/type-orm/entities/departments/department.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DepartmentsRepository {
  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
  ) {}

  async findByCollegeId(
    collegeId: number,
    page: number,
  ): Promise<[Department[], number]> {
    return await this.departmentsRepository
      .createQueryBuilder('department')
      .where('department.college_id = :collegeId', {
        collegeId,
      })
      .orderBy('department.name', 'ASC')
      .take(ListCardConfig.LIMIT)
      .skip(ListCardConfig.LIMIT * (page - 1))
      .getManyAndCount();
  }
}
