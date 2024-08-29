import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentEntity } from '../entities/department.entity';

@Injectable()
export class DepartmentRepository {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>, // Inject the repository here
  ) {}

  async findByCollegeId(collegeId: number): Promise<DepartmentEntity[]> {
    return await this.departmentRepository
      .createQueryBuilder('department')
      .where('department.college_id = :collegeId', { collegeId })
      .take(5)
      .getMany();
  }
}
