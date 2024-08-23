import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from './department.repository';

@Injectable()
export class UserService {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async registerDepartment(): Promise<any> {
    const department = await this.departmentRepository.findByName(
      '컴퓨터공학과',
    );
    return;
  }
}
