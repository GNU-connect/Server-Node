import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CollegeEntity } from '../entities/college.entity';

@Injectable()
export class CollegeRepository {
  constructor(
    @InjectRepository(CollegeEntity)
    private readonly collegeRepository: Repository<CollegeEntity>, // Inject the repository here
  ) {}

  async findByCampusId(campusId: number): Promise<CollegeEntity[]> {
    return await this.collegeRepository
      .createQueryBuilder('college')
      .where('college.campus_id = :campusId', { campusId })
      .take(5)
      .getMany();
  }
}
