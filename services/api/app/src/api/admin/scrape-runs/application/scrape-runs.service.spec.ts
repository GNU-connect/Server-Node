import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  ScrapeRunsService,
  targetKey,
} from 'src/api/admin/scrape-runs/application/scrape-runs.service';
import { ScrapeRun } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { ScrapeRunRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-run.repository';
import { ScrapeTargetsRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-targets.repository';

const ARAM = {
  id: '1',
  meta: [
    { label: '캠퍼스', value: '가좌캠퍼스' },
    { label: '식당', value: '아람관' },
  ],
};
const EDU_CULTURE = {
  id: '2',
  meta: [
    { label: '캠퍼스', value: '가좌캠퍼스' },
    { label: '식당', value: '교육문화식당' },
  ],
};

function createRun(overrides: Partial<ScrapeRun>): ScrapeRun {
  return {
    id: 1,
    type: 'shuttle',
    target: null,
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
  let targetsRepository: jest.Mocked<ScrapeTargetsRepository>;
  let service: ScrapeRunsService;

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findLatestPerType: jest.fn().mockResolvedValue([]),
      findLastSucceededPerType: jest.fn().mockResolvedValue([]),
      findLatestPerTarget: jest.fn().mockResolvedValue([]),
      findLastSucceededPerTarget: jest.fn().mockResolvedValue([]),
      createPending: jest.fn(),
    } as unknown as jest.Mocked<ScrapeRunRepository>;
    targetsRepository = {
      findByType: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<ScrapeTargetsRepository>;
    service = new ScrapeRunsService(repository, targetsRepository);
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
    it('대상 없는 타입은 대기 상태의 수동 run 하나를 등록한다', async () => {
      const run = createRun({ id: 7, trigger: 'manual', status: 'pending' });
      repository.createPending.mockResolvedValue(run);

      await expect(service.requestRun('shuttle')).resolves.toEqual([run]);
      expect(repository.createPending).toHaveBeenCalledWith('shuttle', null);
    });

    it('대상 없는 타입이 이미 대기/실행 중이면 ConflictException을 던진다', async () => {
      repository.createPending.mockResolvedValue(null);

      await expect(service.requestRun('shuttle')).rejects.toThrow(ConflictException);
    });

    it('대상 없는 타입에 target을 주면 BadRequestException을 던진다', async () => {
      await expect(service.requestRun('shuttle', '1')).rejects.toThrow(BadRequestException);
      expect(repository.createPending).not.toHaveBeenCalled();
    });

    it('target을 지정하면 그 대상의 run 하나만 등록한다', async () => {
      targetsRepository.findByType.mockResolvedValue([ARAM, EDU_CULTURE]);
      const run = createRun({ id: 8, type: 'cafeteria', target: '2', status: 'pending' });
      repository.createPending.mockResolvedValue(run);

      await expect(service.requestRun('cafeteria', '2')).resolves.toEqual([run]);
      expect(repository.createPending).toHaveBeenCalledWith('cafeteria', '2');
    });

    it('목록에 없는 target이면 BadRequestException을 던진다', async () => {
      targetsRepository.findByType.mockResolvedValue([ARAM]);

      await expect(service.requestRun('cafeteria', '99')).rejects.toThrow(BadRequestException);
      expect(repository.createPending).not.toHaveBeenCalled();
    });

    it('지정한 대상이 이미 대기/실행 중이면 ConflictException을 던진다', async () => {
      targetsRepository.findByType.mockResolvedValue([ARAM]);
      repository.createPending.mockResolvedValue(null);

      await expect(service.requestRun('cafeteria', '1')).rejects.toThrow(ConflictException);
    });

    it('target 없이 요청하면 대상마다 run을 만들고 진행 중인 대상은 건너뛴다', async () => {
      targetsRepository.findByType.mockResolvedValue([
        ARAM,
        EDU_CULTURE,
        { id: '3', meta: [{ label: '식당', value: '가좌식당' }] },
      ]);
      const first = createRun({ id: 10, type: 'cafeteria', target: '1', status: 'pending' });
      const third = createRun({ id: 12, type: 'cafeteria', target: '3', status: 'pending' });
      repository.createPending
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(third);

      await expect(service.requestRun('cafeteria')).resolves.toEqual([first, third]);
    });

    it('target 없이 요청했는데 모든 대상이 진행 중이면 ConflictException을 던진다', async () => {
      targetsRepository.findByType.mockResolvedValue([ARAM]);
      repository.createPending.mockResolvedValue(null);

      await expect(service.requestRun('cafeteria')).rejects.toThrow(ConflictException);
    });

    it('대상이 하나도 없으면 BadRequestException을 던진다', async () => {
      targetsRepository.findByType.mockResolvedValue([]);

      await expect(service.requestRun('cafeteria')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTargetMetas', () => {
    it('run의 대상 id를 메타데이터로 바꿀 수 있는 맵을 만든다', async () => {
      targetsRepository.findByType.mockResolvedValue([ARAM, EDU_CULTURE]);

      const metas = await service.getTargetMetas([
        createRun({ id: 1, type: 'cafeteria', target: '1' }),
        createRun({ id: 2, type: 'shuttle', target: null }),
      ]);

      expect(metas.get(targetKey('cafeteria', '1'))).toEqual(ARAM.meta);
      expect(metas.get(targetKey('cafeteria', '2'))).toEqual(EDU_CULTURE.meta);
      expect(targetsRepository.findByType).toHaveBeenCalledTimes(1);
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
        {
          type: 'shuttle',
          latestRun: failedShuttle,
          lastSucceededRun: succeededShuttle,
          targets: [],
        },
        { type: 'university-notice', latestRun: null, lastSucceededRun: null, targets: [] },
        { type: 'cafeteria', latestRun: null, lastSucceededRun: null, targets: [] },
        { type: 'academic-calendar', latestRun: null, lastSucceededRun: null, targets: [] },
      ]);
    });

    it('대상이 있는 타입은 대상별 최근 run을 함께 반환한다', async () => {
      targetsRepository.findByType.mockImplementation(async type =>
        type === 'cafeteria' ? [ARAM, EDU_CULTURE] : null,
      );
      const latestFirst = createRun({ id: 9, type: 'cafeteria', target: '1', status: 'failed' });
      const succeededFirst = createRun({ id: 7, type: 'cafeteria', target: '1' });
      repository.findLatestPerTarget.mockResolvedValue([latestFirst]);
      repository.findLastSucceededPerTarget.mockResolvedValue([succeededFirst]);

      const result = await service.getScraperStatuses();
      const cafeteria = result.find(status => status.type === 'cafeteria');

      expect(cafeteria?.targets).toEqual([
        {
          target: '1',
          targetName: '아람관',
          targetMeta: ARAM.meta,
          latestRun: latestFirst,
          lastSucceededRun: succeededFirst,
        },
        {
          target: '2',
          targetName: '교육문화식당',
          targetMeta: EDU_CULTURE.meta,
          latestRun: null,
          lastSucceededRun: null,
        },
      ]);
    });
  });
});
