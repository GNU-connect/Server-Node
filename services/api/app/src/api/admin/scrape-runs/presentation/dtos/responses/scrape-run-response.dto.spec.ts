import { ScrapeRun } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { ScrapeRunResponseDto } from './scrape-run-response.dto';

function createRun(overrides: Partial<ScrapeRun> = {}): ScrapeRun {
  return {
    id: 1,
    type: 'cafeteria',
    target: '1',
    trigger: 'manual',
    status: 'succeeded',
    errorMessage: null,
    createdAt: new Date('2026-09-25T00:00:00.000Z'),
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}

describe('ScrapeRunResponseDto.from', () => {
  it('메타데이터를 그대로 내려주고 targetName은 마지막(가장 구체적인) 값으로 채운다', () => {
    const meta = [
      { label: '캠퍼스', value: '가좌캠퍼스' },
      { label: '식당', value: '아람관' },
    ];

    const dto = ScrapeRunResponseDto.from(createRun(), meta);

    expect(dto.targetMeta).toEqual(meta);
    expect(dto.targetName).toBe('아람관');
  });

  it('메타데이터가 없으면 빈 배열과 null targetName을 내려준다', () => {
    const dto = ScrapeRunResponseDto.from(createRun({ type: 'shuttle', target: null }));

    expect(dto.targetMeta).toEqual([]);
    expect(dto.targetName).toBeNull();
  });
});
