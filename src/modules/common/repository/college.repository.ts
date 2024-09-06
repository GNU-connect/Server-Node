import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollegeEntity } from '../entities/college.entity';
import { ListCardConfig } from 'src/common/utils/constants';

@Injectable()
export class CollegeRepository {
  constructor(
    @InjectRepository(CollegeEntity)
    private readonly collegeRepository: Repository<CollegeEntity>, // Inject the repository here
  ) {}

  async findAll(page: number): Promise<[CollegeEntity[], number]> {
    return await this.collegeRepository
      .createQueryBuilder('college')
      .where("college.name != '공통'")
      .orderBy('college.name', 'ASC')
      .take(ListCardConfig.LIMIT)
      .skip(ListCardConfig.LIMIT * (page - 1))
      .getManyAndCount();
  }
}
