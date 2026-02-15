import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicCalendar } from './academic-calendar.entity';

@Injectable()
export class AcademicCalendarsRepository {
  constructor(
    @InjectRepository(AcademicCalendar)
    private readonly academicCalendarRepository: Repository<AcademicCalendar>,
  ) {}

  /**
   * 특정 년월의 학사일정 조회 (종료되지 않은 일정만)
   * @param year 년도
   * @param month 월 (1-12)
   * @param calendarType 일정 타입 (1: 학부생, 2: 대학원생, 3: 교직원)
   * @returns 학사일정 목록
   */
  async findByYearAndMonth(
    year: number,
    month: number,
    calendarType: number = 1,
  ): Promise<AcademicCalendar[]> {
    // 해당 월의 첫날과 마지막날 계산
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    // 오늘 날짜 (시간 제외)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.academicCalendarRepository
      .createQueryBuilder('academic_calendar')
      .where('academic_calendar.calendar_type = :calendarType', {
        calendarType,
      })
      .andWhere(
        '(academic_calendar.start_date BETWEEN :startOfMonth AND :endOfMonth OR ' +
          'academic_calendar.end_date BETWEEN :startOfMonth AND :endOfMonth OR ' +
          '(academic_calendar.start_date <= :startOfMonth AND academic_calendar.end_date >= :endOfMonth))',
        {
          startOfMonth,
          endOfMonth,
        },
      )
      .andWhere('academic_calendar.end_date >= :today', { today })
      .orderBy('academic_calendar.start_date', 'ASC')
      .addOrderBy('academic_calendar.end_date', 'ASC')
      .getMany();
  }
}
