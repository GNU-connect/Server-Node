import { Injectable } from '@nestjs/common';
import { toKstDateString, toKstYear } from '../../utils/date';
import { BatchJob } from '../batch-job.interface';
import { AcademicCalendarClient } from './academic-calendar.client';
import { AcademicCalendarParser } from './academic-calendar.parser';
import { AcademicCalendarRepository } from './academic-calendar.repository';
import type { ParsedAcademicSchedule } from './type/parsed-academic-schedule';

@Injectable()
export class AcademicCalendarJob implements BatchJob {
  readonly name = 'academic-calendar';

  constructor(
    private readonly client: AcademicCalendarClient,
    private readonly parser: AcademicCalendarParser,
    private readonly repository: AcademicCalendarRepository,
  ) {}

  async run(): Promise<void> {
    const now = new Date();
    const year = toKstYear(now);
    const today = toKstDateString(now);

    const parsed: ParsedAcademicSchedule[] = [];
    for (const targetYear of [year, year + 1]) {
      parsed.push(
        ...this.parser.parse(await this.client.fetchYear(targetYear)),
      );
    }

    const schedules = this.dedupe(
      parsed.filter((schedule) => schedule.endDate >= today),
    );
    if (schedules.length === 0) {
      throw new Error('학사일정 데이터가 없습니다.');
    }

    await this.repository.replaceAll(schedules);
  }

  /**
   * academic_calendar에는 (calendar_type, content, start_date) 유니크 제약이 있어서
   * 종료일만 다른 일정도 하나만 남긴다(먼저 나온 것).
   */
  private dedupe(
    schedules: ParsedAcademicSchedule[],
  ): ParsedAcademicSchedule[] {
    const seen = new Set<string>();
    return schedules.filter((schedule) => {
      const key = `${schedule.calendarType}|${schedule.content}|${schedule.startDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
