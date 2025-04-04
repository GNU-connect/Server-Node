import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { ListCardConfig } from 'src/common/utils/constants';
import { ListDepartmentsRequestDto } from 'src/users/dtos/requests/list-department-request.dto';

@Injectable()
export class DepartmentsRepository {
  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
  ) {}

  async findByCollegeId(
    extra: ListDepartmentsRequestDto,
  ): Promise<[Department[], number]> {
    return await this.departmentsRepository
      .createQueryBuilder('department')
      .where('department.college_id = :collegeId', {
        collegeId: extra.collegeId,
      })
      .orderBy('department.name', 'ASC')
      .take(ListCardConfig.LIMIT)
      .skip(ListCardConfig.LIMIT * (extra.page - 1))
      .getManyAndCount();
  }
}
