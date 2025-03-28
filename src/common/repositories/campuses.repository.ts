import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Campus } from '../entities/campus.entity';

@Injectable()
export class CampusesRepository {
  constructor(
    @InjectRepository(Campus)
    private readonly campusesRepository: Repository<Campus>,
  ) {}

  async findAll(): Promise<Campus[]> {
    return await this.campusesRepository.find({
      select: ['id', 'name', 'thumbnailUrl'],
      where: {
        id: In([1, 2, 3, 4]),
      },
    });
  }

  async getCampusName(campusId: number): Promise<string> {
    const campus = await this.campusesRepository.findOne({
      where: {
        id: campusId,
      },
    });
    return campus.name;
  }
}
