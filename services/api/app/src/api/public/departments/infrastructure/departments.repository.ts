import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListCardConfig } from 'src/api/common/utils/constants';
import { Department } from 'src/api/public/departments/domain/entities/department.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DepartmentsRepository {
  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
  ) {}

  findByCollegeId(collegeId: number, page: number): Promise<[Department[], number]> {
    const limit = ListCardConfig.LIMIT;

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
