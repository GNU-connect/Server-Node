import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CampusEntity } from '../entities/campus.entity';

@Injectable()
export class CampusRepository {
  constructor(
    @InjectRepository(CampusEntity)
    private readonly campusRepository: Repository<CampusEntity>, // Inject the repository here
  ) {}

  async findAll(): Promise<CampusEntity[]> {
    return await this.campusRepository.find({
      select: ['id', 'name', 'thumbnailUrl'],
      where: {
        id: In([1, 2, 3, 4]),
      },
    });
  }
}
