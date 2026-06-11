import { Injectable } from '@nestjs/common';
import { UpsertDepartmentResult } from 'src/api/public/users/application/dtos/results/upsert-department-result.dto';
import { UserProfileResult } from 'src/api/public/users/application/dtos/results/user-profile-result.dto';
import { User } from 'src/api/public/users/domain/entities/users.entity';
import { UsersRepository } from 'src/api/public/users/infrastructure/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public findOne(userId: string): Promise<User | null> {
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

  public async upsert(
    userId: string,
    campusId: number,
    departmentId: number,
  ): Promise<UpsertDepartmentResult> {
    const user = new User();

    user.updateProfile(userId, campusId, departmentId);

    const userResult = await this.usersRepository.save(user);

    return {
      userId: userResult.id,
      campusId: userResult.campusId,
      departmentId: userResult.departmentId,
    };
  }
}
