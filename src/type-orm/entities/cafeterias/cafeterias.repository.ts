import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DietTime } from 'src/api/public/cafeterias/dtos/requests/list-cafeteria-diet-request.dto';
import { CafeteriaDiet } from 'src/type-orm/entities/cafeterias/cafeteria-diet.entity';
import { Cafeteria } from 'src/type-orm/entities/cafeterias/cafeteria.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CafeteriasRepository {
  constructor(
    @InjectRepository(Cafeteria)
    private readonly cafeteriaRepository: Repository<Cafeteria>,
    @InjectRepository(CafeteriaDiet)
    private readonly cafeteriaDietRepository: Repository<CafeteriaDiet>,
  ) {}

  findCafeteriasByCampusId(campusId: number = 1): Promise<Cafeteria[]> {
    return this.cafeteriaRepository.find({
      where: {
        campus: {
          id: campusId,
        },
      },
      order: {
        name: 'ASC',
      },
      relations: ['campus'],
    });
  }

  findCafeteriaById(cafeteriaId: number): Promise<Cafeteria> {
    return this.cafeteriaRepository.findOne({
      where: {
        id: cafeteriaId,
      },
      relations: ['campus'],
    });
  }

  findCafeteriaDietsByCafeteriaId(
    cafeteriaId: number,
    date: Date,
    time: DietTime,
  ): Promise<CafeteriaDiet[]> {
    return this.cafeteriaDietRepository.find({
      where: {
        cafeteria: {
          id: cafeteriaId,
        },
        date,
        time,
      },
    });
  }
}
