import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpsertDepartmentRequestDto } from 'src/api/public/users/dtos/requests/upsert-department-request.dto';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async save(userId: string, extra: UpsertDepartmentRequestDto): Promise<User> {
    return await this.usersRepository.save({
      id: userId,
      campusId: extra.campusId,
      departmentId: extra.departmentId,
    });
  }

  findOne(userId: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { id: userId },
      relations: {
        campus: true,
        department: {
          college: true,
        },
      },
    });
  }
}
