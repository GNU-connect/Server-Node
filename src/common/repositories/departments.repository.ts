import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';
import { ListCardConfig } from 'src/common/utils/constants';

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
      .where('department.college_id = :collegeId', { collegeId })
      .orderBy('department.name', 'ASC')
      .take(5)
      .take(ListCardConfig.LIMIT)
      .skip(ListCardConfig.LIMIT * (page - 1))
      .getManyAndCount();
  }
}
