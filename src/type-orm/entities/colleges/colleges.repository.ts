import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListCardConfig } from 'src/api/common/utils/constants';
import { Repository } from 'typeorm';
import { College } from './college.entity';

@Injectable()
export class CollegesRepository {
  constructor(
    @InjectRepository(College)
    private readonly collegesRepository: Repository<College>,
  ) {}

  findAll(page: number): Promise<[College[], number]> {
    return this.collegesRepository
      .createQueryBuilder('college')
      .where("college.name != '공통'")
      .orderBy('college.name', 'ASC')
      .take(ListCardConfig.LIMIT)
      .skip(ListCardConfig.LIMIT * (page - 1))
      .getManyAndCount();
  }
}
