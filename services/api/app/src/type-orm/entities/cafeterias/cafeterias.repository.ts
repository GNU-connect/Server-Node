import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';
import { TraceSpan } from 'src/api/common/decorators/trace-span.decorator';
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

  @TraceSpan({
    name: 'cafeterias.repository.findCafeteriaById',
    op: 'repository.typeorm',
    attributes: ([cafeteriaId]) => ({
      cafeteriaId: cafeteriaId as number,
    }),
  })
  findCafeteriaById(cafeteriaId: number): Promise<Cafeteria> {
    const queryBuilder = Sentry.startSpan(
      {
        name: 'cafeterias.repository.buildFindCafeteriaByIdQuery',
        op: 'repository.typeorm.prepare',
        attributes: {
          cafeteriaId,
        },
      },
      () =>
        this.cafeteriaRepository
          .createQueryBuilder('cafeteria')
          .leftJoinAndSelect('cafeteria.campus', 'campus')
          .where('cafeteria.id = :cafeteriaId', { cafeteriaId }),
    );

    return Sentry.startSpan(
      {
        name: 'cafeterias.repository.executeFindCafeteriaByIdQuery',
        op: 'repository.typeorm.execute',
        attributes: {
          cafeteriaId,
        },
      },
      () => queryBuilder.getOne(),
    );
  }

  /**
   * 식당 식단 조회
   * - 식단 카테고리, 식단 타입, 식단 이름 조회
   * 
   * 커버링 인덱스를 사용해 쿼리 성능 향상
   */
  @TraceSpan({
    name: 'cafeterias.repository.findCafeteriaDietsByCafeteriaId',
    op: 'repository.typeorm',
    attributes: ([cafeteriaId, date, time]) => ({
      cafeteriaId: cafeteriaId as number,
      dietDate:
        date instanceof Date
          ? date.toISOString().slice(0, 10)
          : String(date),
      dietTime: time as DietTime,
    }),
  })
  findCafeteriaDietsByCafeteriaId(
    cafeteriaId: number,
    date: Date,
    time: DietTime,
  ): Promise<CafeteriaDiet[]> {
    const dietDate = date.toISOString().slice(0, 10);
    const queryBuilder = Sentry.startSpan(
      {
        name: 'cafeterias.repository.buildFindCafeteriaDietsQuery',
        op: 'repository.typeorm.prepare',
        attributes: {
          cafeteriaId,
          dietDate,
          dietTime: time,
        },
      },
      () =>
        this.cafeteriaDietRepository
          .createQueryBuilder('diet')
          .select([
            'diet.dishCategory',
            'diet.dishType',
            'diet.dishName',
          ])
          .where('diet.date = :date', { date })
          .andWhere('diet.cafeteria_id = :cafeteriaId', { cafeteriaId })
          .andWhere('diet.time = :time', { time }),
    );

    return Sentry.startSpan(
      {
        name: 'cafeterias.repository.executeFindCafeteriaDietsQuery',
        op: 'repository.typeorm.execute',
        attributes: {
          cafeteriaId,
          dietDate,
          dietTime: time,
        },
      },
      () => queryBuilder.getMany(),
    );
  }
}
