import { Injectable } from '@nestjs/common';
import { UpsertDepartmentRequestDto } from 'src/api/public/users/dtos/requests/upsert-department-request.dto';
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
  public upsert(
    userId: string,
    extra: UpsertDepartmentRequestDto,
  ): Promise<User> {
    return this.usersRepository.save(userId, extra.campusId, extra.departmentId);
  }
}
