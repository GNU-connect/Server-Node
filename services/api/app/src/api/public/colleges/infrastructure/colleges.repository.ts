import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { College } from 'src/api/public/colleges/domain/entities/college.entity';

@Injectable()
export class CollegesRepository {
  constructor(
    @InjectRepository(College)
    private readonly collegesRepository: Repository<College>,
  ) {}

  findAll(page: number, limit: number): Promise<[College[], number]> {
    return this.collegesRepository.findAndCount({
      where: {
        name: Not('공통'),
      },
      order: {
        name: 'ASC',
      },
      take: limit,
      skip: limit * (page - 1),
    });
  }
}
