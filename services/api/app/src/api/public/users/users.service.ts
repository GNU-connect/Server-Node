import { Injectable } from '@nestjs/common';
import { UpsertDepartmentResult } from 'src/api/public/users/dtos/results/upsert-department-result.dto';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../../type-orm/entities/users/users.entity';
import { UsersRepository } from '../../../type-orm/entities/users/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public findOne(userId: string): Promise<User> {
    return this.usersRepository.findOne(userId);
  }

  @Transactional()
  public async upsert(
    userId: string,
    campusId: number,
    departmentId: number,
  ): Promise<UpsertDepartmentResult> {
    const user = await this.usersRepository.save(userId, campusId, departmentId);
    return {
      userId: user.id,
      campusId: user.campus.id,
      departmentId: user.department.id,
    };
  }
}
