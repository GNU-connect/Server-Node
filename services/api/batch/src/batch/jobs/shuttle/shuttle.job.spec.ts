import { ShuttleClient } from './shuttle.client';
import { ShuttleJob } from './shuttle.job';
import { ShuttleParser } from './shuttle.parser';
import { ShuttleRepository } from './shuttle.repository';

describe('ShuttleJob', () => {
  const html = `
    <p>최근 업데이트 일시 : 2026/03/13 09:47:30</p>
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
  `;
  const collectedAt = new Date(2026, 2, 13, 10, 0, 0);

  let client: ShuttleClient;
  let save: jest.Mock;
  let job: ShuttleJob;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(collectedAt);
    client = { fetch: jest.fn().mockResolvedValue(html) } as never;
    save = jest.fn().mockResolvedValue(undefined);
    job = new ShuttleJob(client, new ShuttleParser(), {
      save,
    } as unknown as ShuttleRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('파싱한 노선별 시간표를 저장한다', async () => {
    await job.run();

    expect(save).toHaveBeenCalledWith([
      {
        routeName: '가좌캠퍼스 → 칠암캠퍼스',
        timetable: { 오전: ['08:20'], 오후: ['13:10'] },
        updatedAt: new Date(2026, 2, 13, 9, 47, 30),
        lastSuccessAt: collectedAt,
      },
      {
        routeName: '칠암캠퍼스 → 가좌캠퍼스',
        timetable: { 오전: ['08:05'], 오후: ['13:00'] },
        updatedAt: new Date(2026, 2, 13, 9, 47, 30),
        lastSuccessAt: collectedAt,
      },
    ]);
  });

  it('파싱에 실패하면 저장하지 않고 에러를 던진다', async () => {
    client.fetch = jest.fn().mockResolvedValue('<html></html>');

    await expect(job.run()).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });
});
