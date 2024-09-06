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

  async findOne(userId: string): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['campus', 'department', 'department.college'],
    });
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
