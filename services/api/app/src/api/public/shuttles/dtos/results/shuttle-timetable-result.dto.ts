export type ShuttleTimetableSectionsResult = Record<string, string[]>;

export interface ShuttleTimetableResult {
  routeName: string;
  timetable: ShuttleTimetableSectionsResult;
  updatedAt: Date;
}
