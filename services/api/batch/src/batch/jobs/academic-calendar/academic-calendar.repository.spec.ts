import { DataSource } from 'typeorm';
import { AcademicCalendarRepository } from './academic-calendar.repository';
import { AcademicCalendar } from './domain/academic-calendar.entity';

describe('AcademicCalendarRepository', () => {
  it('한 트랜잭션에서 전체 삭제 후 삽입한다', async () => {
    const calls: string[] = [];
    const manager = {
      query: jest.fn(() => {
        calls.push('delete');
        return Promise.resolve();
      }),
      insert: jest.fn(() => {
        calls.push('insert');
        return Promise.resolve();
      }),
    };
    const dataSource = {
      transaction: jest.fn((work: (m: typeof manager) => Promise<void>) =>
        work(manager),
      ),
    };
    const repository = new AcademicCalendarRepository(
      dataSource as unknown as DataSource,
    );

    await repository.replaceAll([
      {
        calendarType: 1,
        startDate: '2026-10-01',
        endDate: '2026-10-02',
        content: '중간고사',
      },
    ]);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['delete', 'insert']);
    expect(manager.query).toHaveBeenCalledWith('DELETE FROM academic_calendar');
    expect(manager.insert).toHaveBeenCalledWith(AcademicCalendar, [
      {
        calendarType: 1,
        startDate: '2026-10-01',
        endDate: '2026-10-02',
        content: '중간고사',
      },
    ]);
  });
});
