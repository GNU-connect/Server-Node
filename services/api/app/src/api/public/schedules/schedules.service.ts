import { Injectable } from '@nestjs/common';
import { AcademicCalendar } from 'src/type-orm/entities/academic-calendars/academic-calendar.entity';
import { AcademicCalendarsRepository } from 'src/type-orm/entities/academic-calendars/academic-calendars.repository';

export interface AcademicScheduleResult {
  year: number;
  month: number;
  schedules: AcademicCalendar[];
}

@Injectable()
export class SchedulesService {
  private readonly UNDERGRADUATE_CALENDAR_TYPE = 1;

  constructor(
    private readonly academicCalendarsRepository: AcademicCalendarsRepository,
  ) {}

  /**
   * 학사일정 조회
   * @param month 조회할 월 (선택사항, 기본값: 현재 월)
   */
  async getAcademicSchedules(month?: number): Promise<AcademicScheduleResult> {
    const now = new Date();
    const year = now.getFullYear();
    const targetMonth = month ?? now.getMonth() + 1;

    const schedules = await this.academicCalendarsRepository.findByYearAndMonth(
      year,
      targetMonth,
      this.UNDERGRADUATE_CALENDAR_TYPE,
    );

    return { year, month: targetMonth, schedules };
  }
}
