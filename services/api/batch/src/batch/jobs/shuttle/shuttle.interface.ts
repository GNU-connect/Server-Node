/**
  "오전": ["08:20", "09:00 (금요일 미운행)"],
  "오후": ["13:10 (금요일 미운행)", "13:40"],
 */
export type ShuttleTimetableMap = Record<string, string[]>;

export interface ShuttleTimetable {
  routeName: string;
  timetable?: Record<string, unknown>;
}
