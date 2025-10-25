import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CafeteriasRepository {
  constructor(
    @InjectRepository(Cafeteria)
    private readonly cafeteriaRepository: Repository<Cafeteria>,
  ) {}

  findByCampusId(campusId: number = 1): Promise<Cafeteria[]> {
    return this.cafeteriaRepository.find({
      where: {
        campus: {
          id: campusId,
        },
      },
      relations: ['campus'],
    });
  }
}
