import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from 'src/api/public/departments/domain/entities/department.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DepartmentsRepository {
  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
  ) {}

  findByCollegeId(collegeId: number, page: number, limit: number): Promise<[Department[], number]> {
    return this.departmentsRepository.findAndCount({
      where: {
        collegeId,
      },
      order: {
        name: 'ASC',
      },
      take: limit,
      skip: limit * (page - 1),
    });
  }
}
