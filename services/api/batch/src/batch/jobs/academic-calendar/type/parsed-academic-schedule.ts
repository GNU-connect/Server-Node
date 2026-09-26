export interface ParsedAcademicSchedule {
  /** 1: 학부, 2: 그 외(대학원 등) */
  calendarType: 1 | 2;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  content: string;
}
