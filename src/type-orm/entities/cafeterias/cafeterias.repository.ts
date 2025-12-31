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

  /**
   * 식당 식단 조회
   * - 식단 카테고리, 식단 타입, 식단 이름 조회
   * 
   * 커버링 인덱스를 사용해 쿼리 성능 향상
   */
  findCafeteriaDietsByCafeteriaId(
    cafeteriaId: number,
    date: Date,
    time: DietTime,
  ): Promise<CafeteriaDiet[]> {
    return this.cafeteriaDietRepository
    .createQueryBuilder('diet')
    .select([
      'diet.dishCategory',
      'diet.dishType',
      'diet.dishName',
    ])
    .where('diet.date = :date', { date })
    .andWhere('diet.cafeteria_id = :cafeteriaId', { cafeteriaId })
    .andWhere('diet.time = :time', { time })
    .getMany();
  }
}
