/**
 * HTML 셔틀 시간표를 파싱한 저장 전 중간 데이터입니다.
 *
 * 예:
 * {
 *   routeName: '가좌캠퍼스 → 칠암캠퍼스',
 *   timetable: {
 *     오전: ['08:20', '09:00 (금요일 미운행)'],
 *     오후: ['13:10 (금요일 미운행)', '13:40'],
 *   },
 * }
 */
export type ShuttleTimetableMap = Record<string, string[]>;

export interface ParsedShuttleTimetable {
  routeName: string;
  timetable: ShuttleTimetableMap;
}
