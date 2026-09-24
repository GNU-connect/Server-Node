import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ShuttleParser } from './shuttle.parser';

describe('ShuttleParser', () => {
  const parser = new ShuttleParser();
  const fixture = readFileSync(
    join(__dirname, '__fixtures__/shuttle-timetable.html'),
    'utf8',
  );
  const htmlWithTablesOnly = `
    <html>
      <table>
        <tr><th>가좌캠퍼스 → 칠암캠퍼스<br>(출발지: 가좌캠퍼스)</th></tr>
        <tr><th>오전</th><th>오후</th></tr>
        <tr><td>08 : 20</td><td>13 : 10</td></tr>
      </table>
      <table>
        <tr><th>칠암캠퍼스 → 가좌캠퍼스<br>(출발지: 칠암캠퍼스)</th></tr>
        <tr><th>오전</th><th>오후</th></tr>
        <tr><td>08 : 05</td><td>13 : 00</td></tr>
      </table>
    </html>
  `;

  describe('정상 HTML을 파싱할 때', () => {
    const result = parser.parse(fixture);

    it('최근 업데이트 일시를 Date로 변환한다', () => {
      expect(result.updatedAt).toEqual(new Date(2026, 2, 13, 9, 47, 30));
    });

    it('캠퍼스 간 셔틀 노선 2개를 찾는다', () => {
      expect(result.timetables).toHaveLength(2);
      expect(result.timetables.map((timetable) => timetable.routeName)).toEqual(
        ['가좌캠퍼스 → 칠암캠퍼스', '칠암캠퍼스 → 가좌캠퍼스'],
      );
    });

    it('가좌캠퍼스에서 칠암캠퍼스로 가는 오전 시간표를 파싱한다', () => {
      expect(result.timetables[0].routeName).toBe('가좌캠퍼스 → 칠암캠퍼스');
      expect(result.timetables[0].timetable.오전).toEqual(
        expect.arrayContaining(['08:20', '09:00 (금요일 미운행)', '09:30']),
      );
    });

    it('가좌캠퍼스에서 칠암캠퍼스로 가는 오후 시간표를 파싱한다', () => {
      expect(result.timetables[0].routeName).toBe('가좌캠퍼스 → 칠암캠퍼스');
      expect(result.timetables[0].timetable.오후).toEqual(
        expect.arrayContaining([
          '13:10 (금요일 미운행)',
          '13:40',
          '13:50',
          '17:30',
        ]),
      );
    });

    it('칠암캠퍼스에서 가좌캠퍼스로 가는 오전 시간표를 파싱한다', () => {
      expect(result.timetables[1].routeName).toBe('칠암캠퍼스 → 가좌캠퍼스');
      expect(result.timetables[1].timetable.오전).toEqual(
        expect.arrayContaining(['08:05', '08:10', '08:15']),
      );
    });

    it('칠암캠퍼스에서 가좌캠퍼스로 가는 오후 시간표를 파싱한다', () => {
      expect(result.timetables[1].routeName).toBe('칠암캠퍼스 → 가좌캠퍼스');
      expect(result.timetables[1].timetable.오후).toEqual(
        expect.arrayContaining(['13:00', '13:10', '13:20']),
      );
    });
  });

  describe('필수 HTML 요소가 없을 때', () => {
    it('최근 업데이트 일시가 없으면 에러를 던진다', () => {
      expect(() => parser.parse(htmlWithTablesOnly)).toThrow(
        '셔틀 시간표 최근 업데이트 일시를 찾을 수 없습니다.',
      );
    });

    it('최근 업데이트 일시는 있지만 시간표 테이블이 없으면 에러를 던진다', () => {
      expect(() =>
        parser.parse('<html>최근 업데이트 일시 : 2026/03/13 09:47:30</html>'),
      ).toThrow('셔틀 시간표 테이블을 찾을 수 없습니다.');
    });
  });
});
