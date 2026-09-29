import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { Cafeteria } from './domain/cafeteria.entity';
import { CafeteriaDiet } from './domain/cafeteria-diet.entity';
import type { ParsedCafeteriaDish } from './type/parsed-cafeteria-menu';

const INSERT_CHUNK_SIZE = 500;

@Injectable()
export class CafeteriaRepository {
  constructor(
    @InjectRepository(Cafeteria)
    private readonly repository: Repository<Cafeteria>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Cafeteria[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<Cafeteria | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * 식당의 해당 기간 식단을 새 식단으로 교체하고 마지막 식단 날짜를 갱신한다.
   * 중간에 실패하면 삭제도 롤백된다.
   */
  async replaceWeek(
    cafeteriaId: number,
    range: { startDate: string; endDate: string },
    dishes: ParsedCafeteriaDish[],
  ): Promise<void> {
    const rows = dishes.map((dish) => ({
      cafeteriaId,
      date: dish.date,
      day: dish.day,
      time: dish.time,
      dishCategory: dish.dishCategory,
      dishType: dish.dishType,
      dishName: dish.dishName,
    }));
    const lastDate = dishes.reduce(
      (latest, dish) => (dish.date > latest ? dish.date : latest),
      dishes[0].date,
    );

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(CafeteriaDiet, {
        cafeteriaId,
        date: Between(range.startDate, range.endDate),
      });
      for (let start = 0; start < rows.length; start += INSERT_CHUNK_SIZE) {
        await manager.insert(
          CafeteriaDiet,
          rows.slice(start, start + INSERT_CHUNK_SIZE),
        );
      }
      await manager.update(Cafeteria, { id: cafeteriaId }, { lastDate });
    });
  }
}
