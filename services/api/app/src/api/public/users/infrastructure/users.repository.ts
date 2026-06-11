import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/api/public/users/domain/entities/users.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  save(user: Partial<User>): Promise<User> {
    return this.usersRepository.save(user);
  }

  findOne(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        id: userId,
      },
      relations: {
        campus: true,
        department: {
          college: true,
        },
      },
    });
  }
}
