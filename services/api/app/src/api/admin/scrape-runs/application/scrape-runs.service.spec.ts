import { ConflictException, NotFoundException } from '@nestjs/common';
import { ScrapeRunsService } from 'src/api/admin/scrape-runs/application/scrape-runs.service';
import { ScrapeRun } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { ScrapeRunRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-run.repository';

function createRun(overrides: Partial<ScrapeRun>): ScrapeRun {
  return {
    id: 1,
    type: 'shuttle',
    trigger: 'cron',
    status: 'succeeded',
    errorMessage: null,
    createdAt: new Date('2026-09-25T00:00:00.000Z'),
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}

describe('ScrapeRunsService', () => {
  let repository: jest.Mocked<ScrapeRunRepository>;
  let service: ScrapeRunsService;

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findLatestPerType: jest.fn(),
      findLastSucceededPerType: jest.fn(),
      createPending: jest.fn(),
    } as unknown as jest.Mocked<ScrapeRunRepository>;
    service = new ScrapeRunsService(repository);
  });

  describe('getRuns', () => {
    it('limit보다 많이 조회되면 마지막 항목 id를 다음 커서로 반환한다', async () => {
      repository.findMany.mockResolvedValue([
        createRun({ id: 5 }),
        createRun({ id: 4 }),
        createRun({ id: 3 }),
      ]);

      const result = await service.getRuns({ type: 'shuttle', limit: 2 });

      expect(repository.findMany).toHaveBeenCalledWith({ type: 'shuttle', limit: 3 });
      expect(result.runs.map(run => run.id)).toEqual([5, 4]);
      expect(result.nextCursor).toBe(4);
    });

    it('마지막 페이지면 다음 커서가 null이다', async () => {
      repository.findMany.mockResolvedValue([createRun({ id: 1 })]);

      const result = await service.getRuns({ limit: 2 });

      expect(result.nextCursor).toBeNull();
    });
  });

  describe('getRun', () => {
    it('run이 없으면 NotFoundException을 던진다', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getRun(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestRun', () => {
    it('대기 상태의 수동 run을 등록한다', async () => {
      const run = createRun({ id: 7, trigger: 'manual', status: 'pending' });
      repository.createPending.mockResolvedValue(run);

      await expect(service.requestRun('shuttle')).resolves.toBe(run);
      expect(repository.createPending).toHaveBeenCalledWith('shuttle');
    });

    it('같은 타입이 이미 대기/실행 중이면 ConflictException을 던진다', async () => {
      repository.createPending.mockResolvedValue(null);

      await expect(service.requestRun('shuttle')).rejects.toThrow(ConflictException);
    });
  });

  describe('getScraperStatuses', () => {
    it('모든 수집 타입에 대해 최근 run과 최근 성공 run을 반환한다', async () => {
      const failedShuttle = createRun({ id: 3, status: 'failed' });
      const succeededShuttle = createRun({ id: 2 });
      repository.findLatestPerType.mockResolvedValue([failedShuttle]);
      repository.findLastSucceededPerType.mockResolvedValue([succeededShuttle]);

      const result = await service.getScraperStatuses();

      expect(result).toEqual([
        { type: 'shuttle', latestRun: failedShuttle, lastSucceededRun: succeededShuttle },
        { type: 'notice', latestRun: null, lastSucceededRun: null },
        { type: 'cafeteria', latestRun: null, lastSucceededRun: null },
        { type: 'academic-calendar', latestRun: null, lastSucceededRun: null },
      ]);
    });
  });
});
