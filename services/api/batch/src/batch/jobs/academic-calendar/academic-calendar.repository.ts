import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AcademicCalendar } from './domain/academic-calendar.entity';
import type { ParsedAcademicSchedule } from './type/parsed-academic-schedule';

@Injectable()
export class AcademicCalendarRepository {
  constructor(private readonly dataSource: DataSource) {}

  /** 학사일정 전체를 교체한다. 삽입이 실패하면 삭제도 롤백된다. */
  async replaceAll(schedules: ParsedAcademicSchedule[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM academic_calendar');
      await manager.insert(
        AcademicCalendar,
        schedules.map(({ calendarType, startDate, endDate, content }) => ({
          calendarType,
          startDate,
          endDate,
          content,
        })),
      );
    });
  }
}
