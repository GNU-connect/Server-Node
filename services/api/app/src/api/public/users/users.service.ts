import { Injectable } from '@nestjs/common';
import { UpsertDepartmentResult } from 'src/api/public/users/dtos/results/upsert-department-result.dto';
import { UserProfileResult } from 'src/api/public/users/dtos/results/user-profile-result.dto';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../../type-orm/entities/users/users.entity';
import { UsersRepository } from '../../../type-orm/entities/users/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public findOne(userId: string): Promise<User> {
    return this.usersRepository.findOne(userId);
  }

  public createProfileResult(user: User): UserProfileResult {
    const campusName = user.campus?.name || '미등록';
    const collegeName = user.department?.college?.name;
    const departmentName = user.department?.name;

    return {
      userId: user.id,
      campusName,
      affiliationName:
        !collegeName && !departmentName
          ? '미등록'
          : [collegeName, departmentName].filter(Boolean).join(' '),
    };
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
