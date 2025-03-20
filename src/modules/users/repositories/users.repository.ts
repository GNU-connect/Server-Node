import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/users.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async save(userId: string, campusId: number, departmentId: number): Promise<User> {
    return await this.usersRepository.save({id: userId, campusId, departmentId});
  }

  async findByUserId(userId: string): Promise<User> {
    return await this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.campus', 'campus')
      .leftJoinAndSelect('user.department', 'department')
      .leftJoinAndSelect('department.college', 'college')
      .select([
        'user.id',
        'campus.name',
        'department.name',
        'college.name'
      ])
      .where('user.id = :userId', { userId })
      .cache(true)
      .getOne();
  }

  async existsByUserId(userId: string): Promise<boolean> {
    return (await this.usersRepository.findOne({ where: { id: userId } })) !== null;
  }
}
