import { scheduleResponse } from './__fixtures__/schedule-response';
import { AcademicCalendarParser } from './academic-calendar.parser';

describe('AcademicCalendarParser', () => {
  const parser = new AcademicCalendarParser();

  it('링크에서 기간과 분류, 내용을 뽑는다', () => {
    const raw = scheduleResponse([
      ['2026/12/22', '2027/02/28', '[학부] 2학기 동계방학'],
      ['2026/12/22', '2027/02/28', '[대학원] 2학기 동계방학'],
    ]);

    expect(parser.parse(raw)).toEqual([
      {
        calendarType: 1,
        startDate: '2026-12-22',
        endDate: '2027-02-28',
        content: '2학기 동계방학',
      },
      {
        calendarType: 2,
        startDate: '2026-12-22',
        endDate: '2027-02-28',
        content: '2학기 동계방학',
      },
    ]);
  });

  it('분류 표기가 없는 항목은 건너뛴다', () => {
    const raw = scheduleResponse([
      ['2026/10/01', '2026/10/01', '분류 없는 일정'],
      ['2026/10/02', '2026/10/02', '[학부] 개천절 대체'],
    ]);

    expect(parser.parse(raw)).toHaveLength(1);
  });

  it('일정이 없는 표는 빈 배열이다', () => {
    expect(parser.parse(scheduleResponse([]))).toEqual([]);
  });

  it('JSON 문자열이 아닌 응답이면 에러를 던진다', () => {
    expect(() => parser.parse('<html>점검 중</html>')).toThrow();
    expect(() => parser.parse('{"a":1}')).toThrow('학사일정 응답 형식');
  });
});
