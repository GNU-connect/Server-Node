import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Campus } from 'src/type-orm/entities/campuses/campus.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class CampusesRepository {
  constructor(
    @InjectRepository(Campus)
    private readonly campusesRepository: Repository<Campus>,
  ) {}

  findAll(): Promise<Campus[]> {
    return this.campusesRepository.find({
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
