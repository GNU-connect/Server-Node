export type ShuttleTimetableSectionsResult = Record<string, string[]>;

export interface ShuttleTimeEntryViewResult {
  time: string;
  memo: string | null;
  status: 'past' | 'next' | 'future';
}

export interface ShuttleTimetableSectionViewResult {
  label: string;
  times: ShuttleTimeEntryViewResult[];
}

export interface ShuttleNextBusResult {
  time: string;
  minutesUntil: number;
}

export interface ShuttleTimetableViewResult {
  nextBus: ShuttleNextBusResult | null;
  sections: ShuttleTimetableSectionViewResult[];
}

export interface ShuttleTimetableResult {
  routeName: string;
  timetable: ShuttleTimetableSectionsResult;
  updatedAt: Date;
}
