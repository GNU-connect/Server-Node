import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ShuttleParser } from './shuttle.parser';

describe('ShuttleParser', () => {
  const parser = new ShuttleParser();

  it('교내 셔틀 시간표 HTML을 방향별 시간표로 변환한다', () => {
    const html = readFileSync(join(__dirname, '__fixtures__/shuttle-timetable.html'), 'utf8');

    const result = parser.parse(html);

    expect(result).toHaveLength(2);
    expect(result[0].routeName).toBe('가좌캠퍼스 → 칠암캠퍼스');
    expect(result[0].timetable.오전).toEqual(
      expect.arrayContaining(['08:20', '09:00 (금요일 미운행)', '09:30']),
    );
    expect(result[0].timetable.오후).toEqual(
      expect.arrayContaining(['13:10 (금요일 미운행)', '13:40', '13:50', '17:30']),
    );
    expect(result[1].routeName).toBe('칠암캠퍼스 → 가좌캠퍼스');
    expect(result[1].timetable.오전).toEqual(
      expect.arrayContaining(['08:05', '08:10', '08:15']),
    );
    expect(result[1].timetable.오후).toEqual(
      expect.arrayContaining(['13:00', '13:10', '13:20']),
    );
  });
});
