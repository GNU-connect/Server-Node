import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findUserProfile(userId: string): Promise<UserEntity> {
    return await this.userRepository.createQueryBuilder('user')
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

  async isExistUser(userId: string): Promise<boolean> {
    return (await this.userRepository.findOne({ where: { id: userId } })) !== null;
  }

  async createUserInfo(
    userId: string,
    campusId: number,
    departmentId: number,
  ): Promise<void> {
    await this.userRepository.insert({
      id: userId,
      campusId,
      departmentId,
    });
  }

  async updateUserInfo(
    userId: string,
    campusId: number,
    departmentId: number,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      campusId,
      departmentId,
    });
  }
}
