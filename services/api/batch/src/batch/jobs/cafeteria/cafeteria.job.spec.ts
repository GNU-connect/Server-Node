import { CafeteriaClient } from './cafeteria.client';
import { CafeteriaJob } from './cafeteria.job';
import { CafeteriaParser } from './cafeteria.parser';
import { CafeteriaRepository } from './cafeteria.repository';
import type { Cafeteria } from './domain/cafeteria.entity';

const html = (menu: string) => `
  <table>
    <thead><tr><th>구분</th><th>월 <br>2026-09-21</th></tr></thead>
    <tbody><tr><th>아침</th><td><div><p class="fm_tit_p mgt15">A코스</p><p class="">${menu}</p></div></td></tr></tbody>
  </table>`;

const cafeteria = {
  id: 7,
  name: '아람관',
  type: 'dorm',
  restSeq: 47,
  mi: 7278,
  schSysId: '',
  formType: 1,
} as Cafeteria;

describe('CafeteriaJob', () => {
  let client: { fetch: jest.Mock };
  let repository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    replaceWeek: jest.Mock;
  };
  let job: CafeteriaJob;

  beforeEach(() => {
    client = { fetch: jest.fn().mockResolvedValue(html('쌀밥<br/>국')) };
    repository = {
      findAll: jest
        .fn()
        .mockResolvedValue([cafeteria, { ...cafeteria, id: 8 }]),
      findById: jest.fn().mockResolvedValue(cafeteria),
      replaceWeek: jest.fn().mockResolvedValue(undefined),
    };
    job = new CafeteriaJob(
      client as unknown as CafeteriaClient,
      new CafeteriaParser(),
      repository as unknown as CafeteriaRepository,
    );
  });

  it('식당 id를 문자열 대상 목록으로 돌려준다', async () => {
    await expect(job.targets()).resolves.toEqual(['7', '8']);
  });

  it('대상 식당의 식단을 수집해 그 주를 교체한다', async () => {
    await job.run('7');

    expect(repository.findById).toHaveBeenCalledWith(7);
    expect(client.fetch).toHaveBeenCalledWith(cafeteria);
    expect(repository.replaceWeek).toHaveBeenCalledWith(
      7,
      { startDate: '2026-09-21', endDate: '2026-09-21' },
      [
        {
          date: '2026-09-21',
          day: '월',
          time: '아침',
          dishType: null,
          dishCategory: 'A코스',
          dishName: '쌀밥',
        },
        {
          date: '2026-09-21',
          day: '월',
          time: '아침',
          dishType: null,
          dishCategory: 'A코스',
          dishName: '국',
        },
      ],
    );
  });

  it('target 없이 실행하면 에러를 던진다', async () => {
    await expect(job.run()).rejects.toThrow('target');
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('없는 식당이면 에러를 던진다', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(job.run('99')).rejects.toThrow('99');
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('숫자가 아닌 target이면 조회하지 않고 에러를 던진다', async () => {
    await expect(job.run('abc')).rejects.toThrow('abc');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('메뉴가 하나도 없으면 기존 식단을 바꾸지 않고 성공한다', async () => {
    client.fetch.mockResolvedValue(html(''));

    await expect(job.run('7')).resolves.toBeUndefined();
    expect(repository.replaceWeek).not.toHaveBeenCalled();
  });

  it('식단 표가 없는 페이지면 에러를 던지고 저장하지 않는다', async () => {
    client.fetch.mockResolvedValue('<html></html>');

    await expect(job.run('7')).rejects.toThrow('식단 표를 찾을 수 없습니다.');
    expect(repository.replaceWeek).not.toHaveBeenCalled();
  });
});
