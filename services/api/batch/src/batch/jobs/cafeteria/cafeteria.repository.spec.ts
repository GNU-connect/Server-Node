import { DataSource, Repository } from 'typeorm';
import { CafeteriaRepository } from './cafeteria.repository';
import { Cafeteria } from './domain/cafeteria.entity';
import { CafeteriaDiet } from './domain/cafeteria-diet.entity';

const dish = (date: string, dishName: string) => ({
  date,
  day: '월',
  time: '점심',
  dishType: null,
  dishCategory: 'A코스',
  dishName,
});

const createRepository = (manager: object) => {
  const dataSource = {
    transaction: jest.fn((work: (m: object) => Promise<void>) => work(manager)),
  };
  return {
    dataSource,
    repository: new CafeteriaRepository(
      {} as Repository<Cafeteria>,
      dataSource as unknown as DataSource,
    ),
  };
};

describe('CafeteriaRepository', () => {
  it('한 트랜잭션에서 해당 주를 지우고 새 식단을 넣고 last_date를 갱신한다', async () => {
    const calls: string[] = [];
    const manager = {
      delete: jest.fn(() => {
        calls.push('delete');
        return Promise.resolve();
      }),
      insert: jest.fn(() => {
        calls.push('insert');
        return Promise.resolve();
      }),
      update: jest.fn(() => {
        calls.push('update');
        return Promise.resolve();
      }),
    };
    const { dataSource, repository } = createRepository(manager);

    await repository.replaceWeek(
      7,
      { startDate: '2026-09-21', endDate: '2026-09-27' },
      [dish('2026-09-21', '쌀밥'), dish('2026-09-23', '국')],
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['delete', 'insert', 'update']);
    expect(manager.insert).toHaveBeenCalledWith(CafeteriaDiet, [
      {
        cafeteriaId: 7,
        date: '2026-09-21',
        day: '월',
        time: '점심',
        dishCategory: 'A코스',
        dishType: null,
        dishName: '쌀밥',
      },
      {
        cafeteriaId: 7,
        date: '2026-09-23',
        day: '월',
        time: '점심',
        dishCategory: 'A코스',
        dishType: null,
        dishName: '국',
      },
    ]);
    expect(manager.update).toHaveBeenCalledWith(
      Cafeteria,
      { id: 7 },
      { lastDate: '2026-09-23' },
    );
  });

  it('식단이 많으면 나눠서 삽입한다', async () => {
    const manager = {
      delete: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };
    const { repository } = createRepository(manager);
    const dishes = Array.from({ length: 1200 }, (_, i) =>
      dish('2026-09-21', `메뉴${i}`),
    );

    await repository.replaceWeek(
      1,
      { startDate: '2026-09-21', endDate: '2026-09-27' },
      dishes,
    );

    expect(manager.insert).toHaveBeenCalledTimes(3);
  });
});
