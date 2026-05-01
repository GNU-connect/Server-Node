import { AcademicCalendar } from 'src/type-orm/entities/academic-calendars/academic-calendar.entity';

export interface AcademicScheduleResult {
  year: number;
  month: number;
  schedules: AcademicCalendar[];
}
