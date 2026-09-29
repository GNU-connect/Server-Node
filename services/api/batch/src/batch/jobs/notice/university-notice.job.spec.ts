import { NoticeClient } from './notice.client';
import { NoticeParser } from './notice.parser';
import { NoticeRepository } from './notice.repository';
import { UniversityNoticeJob } from './university-notice.job';
import type { NoticeCategory } from './domain/notice-category.entity';

const html = (...items: Array<[id: number, date: string]>) => `
  <table>
    <thead><tr><th>번호</th><th>제목</th><th>등록일</th></tr></thead>
    <tbody>${items
      .map(
        ([id, date]) =>
          `<tr><td>${id}</td><td><a data-id="${id}" class="nttInfoBtn">공지 ${id}</a></td><td>${date}</td></tr>`,
      )
      .join('')}</tbody>
  </table>`;

const category = (overrides: Partial<NoticeCategory> = {}): NoticeCategory =>
  ({
    id: 3,
    departmentId: 117,
    category: '학사',
    mi: 1127,
    bbsId: 1029,
    lastNttSn: 0,
    ...overrides,
  }) as NoticeCategory;

describe('UniversityNoticeJob', () => {
  let client: { fetch: jest.Mock };
  let repository: {
    findCategoriesByDepartmentId: jest.Mock;
    findCategoryById: jest.Mock;
    saveNew: jest.Mock;
  };
  let job: UniversityNoticeJob;

  beforeEach(() => {
    client = { fetch: jest.fn() };
    repository = {
      findCategoriesByDepartmentId: jest
        .fn()
        .mockResolvedValue([category(), category({ id: 4 })]),
      findCategoryById: jest.fn().mockResolvedValue(category()),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };
    job = new UniversityNoticeJob(
      client as unknown as NoticeClient,
      new NoticeParser(),
      repository as unknown as NoticeRepository,
    );
  });

  it('학교 공지(학과 117)의 카테고리 id를 대상으로 돌려준다', async () => {
    await expect(job.targets()).resolves.toEqual(['3', '4']);
    expect(repository.findCategoriesByDepartmentId).toHaveBeenCalledWith(117);
  });

  it('첫 실행(last_ntt_sn = 0)은 첫 페이지의 글을 모두 오래된 순으로 저장한다', async () => {
    client.fetch.mockResolvedValue(
      html([30, '2026.09.21'], [20, '2026.09.10'], [10, '2026.08.01']),
    );

    await job.run('3');

    expect(client.fetch).toHaveBeenCalledWith(category());
    expect(repository.saveNew).toHaveBeenCalledWith(3, [
      { nttSn: 10, title: '공지 10', createdAt: '2026-08-01' },
      { nttSn: 20, title: '공지 20', createdAt: '2026-09-10' },
      { nttSn: 30, title: '공지 30', createdAt: '2026-09-21' },
    ]);
  });

  it('30일이 지난 글도 새 글이면 저장한다', async () => {
    repository.findCategoryById.mockResolvedValue(category({ lastNttSn: 5 }));
    client.fetch.mockResolvedValue(html([6, '2025.01.01']));

    await job.run('3');

    expect(repository.saveNew).toHaveBeenCalledWith(3, [
      { nttSn: 6, title: '공지 6', createdAt: '2025-01-01' },
    ]);
  });

  it('last_ntt_sn 이하의 글은 저장하지 않는다', async () => {
    repository.findCategoryById.mockResolvedValue(category({ lastNttSn: 20 }));
    client.fetch.mockResolvedValue(
      html([30, '2026.09.21'], [20, '2026.09.10'], [10, '2026.08.01']),
    );

    await job.run('3');

    expect(repository.saveNew).toHaveBeenCalledWith(3, [
      { nttSn: 30, title: '공지 30', createdAt: '2026-09-21' },
    ]);
  });

  it('새 글이 없으면 저장하지 않고 성공한다', async () => {
    repository.findCategoryById.mockResolvedValue(category({ lastNttSn: 30 }));
    client.fetch.mockResolvedValue(html([30, '2026.09.21']));

    await expect(job.run('3')).resolves.toBeUndefined();
    expect(repository.saveNew).not.toHaveBeenCalled();
  });

  it('target 없이 실행하면 에러를 던진다', async () => {
    await expect(job.run()).rejects.toThrow('target');
  });

  it('없는 카테고리나 학교 공지가 아닌 카테고리면 에러를 던진다', async () => {
    repository.findCategoryById.mockResolvedValueOnce(null);
    await expect(job.run('99')).rejects.toThrow('99');

    repository.findCategoryById.mockResolvedValueOnce(
      category({ departmentId: 5 }),
    );
    await expect(job.run('3')).rejects.toThrow('학교 공지');
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('게시판 표를 못 읽으면 에러를 던지고 저장하지 않는다', async () => {
    client.fetch.mockResolvedValue('<html></html>');

    await expect(job.run('3')).rejects.toThrow(
      '공지 목록 표를 찾을 수 없습니다.',
    );
    expect(repository.saveNew).not.toHaveBeenCalled();
  });
});
