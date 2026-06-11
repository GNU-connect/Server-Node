import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DietTime } from 'src/api/public/cafeterias/presentation/dtos/requests/list-cafeteria-diet-request.dto';
import { CafeteriaDiet } from 'src/api/public/cafeterias/domain/entities/cafeteria-diet.entity';
import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CafeteriasRepository {
  constructor(
    @InjectRepository(Cafeteria)
    private readonly cafeteriaRepository: Repository<Cafeteria>,
    @InjectRepository(CafeteriaDiet)
    private readonly cafeteriaDietRepository: Repository<CafeteriaDiet>,
  ) {}

  findCafeteriasByCampusId(campusId: number): Promise<Cafeteria[]> {
    return this.cafeteriaRepository.find({
      where: {
        campus: {
          id: campusId,
        },
      },
      order: {
        name: 'ASC',
      },
      relations: {
        campus: true,
      },
    });
  }

  findCafeteriaById(cafeteriaId: number): Promise<Cafeteria | null> {
    return this.cafeteriaRepository.findOne({
      where: {
        id: cafeteriaId,
      },
      relations: {
        campus: true,
      },
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
    return this.cafeteriaDietRepository.find({
      select: {
        dishCategory: true,
        dishType: true,
        dishName: true,
      },
      where: {
        date,
        cafeteriaId,
        time,
      },
    });
  }
}
