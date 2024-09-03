import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from '../entities/department.entity';
import { ListCardConfig } from 'src/common/utils/constants';

@Injectable()
export class DepartmentRepository {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>, // Inject the repository here
  ) {}

  async findByCollegeId(
    collegeId: number,
    page: number,
  ): Promise<[DepartmentEntity[], number]> {
    return await this.departmentRepository
      .createQueryBuilder('department')
      .where('department.college_id = :collegeId', { collegeId })
      .orderBy('department.name', 'ASC')
      .take(5)
      .take(ListCardConfig.LIMIT)
      .skip(ListCardConfig.LIMIT * (page - 1))
      .getManyAndCount();
  }
}
