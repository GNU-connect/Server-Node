export interface AcademicScheduleItemResult {
  content: string;
  startDate: Date;
  endDate: Date;
}

export interface AcademicScheduleResult {
  year: number;
  month: number;
  schedules: AcademicScheduleItemResult[];
}
