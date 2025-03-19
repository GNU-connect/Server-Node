import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { College } from '../entities/college.entity';
import { ListCardConfig } from 'src/modules/common/utils/constants';

@Injectable()
export class CollegesRepository {
  constructor(
    @InjectRepository(College)
    private readonly collegesRepository: Repository<College>,
  ) {}

  async findAll(page: number): Promise<[College[], number]> {
    return await this.collegesRepository
      .createQueryBuilder('college')
      .where("college.name != '공통'")
      .orderBy('college.name', 'ASC')
      .take(ListCardConfig.LIMIT)
      .skip(ListCardConfig.LIMIT * (page - 1))
      .getManyAndCount();
  }
}
