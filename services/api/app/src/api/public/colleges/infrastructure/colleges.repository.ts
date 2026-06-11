import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListCardConfig } from 'src/api/common/utils/constants';
import { Not, Repository } from 'typeorm';
import { College } from 'src/api/public/colleges/domain/entities/college.entity';

@Injectable()
export class CollegesRepository {
  constructor(
    @InjectRepository(College)
    private readonly collegesRepository: Repository<College>,
  ) {}

  findAll(page: number): Promise<[College[], number]> {
    const limit = ListCardConfig.LIMIT;

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
