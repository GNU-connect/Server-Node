import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async save(
    userId: string,
    campusId: number,
    departmentId: number,
  ): Promise<User> {
    return await this.usersRepository.save({
      id: userId,
      campus: { id: campusId },
      department: { id: departmentId },
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
