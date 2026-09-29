import { BatchService } from './batch.service';
import { BatchJob } from './jobs/batch-job.interface';
import {
  ClaimedScrapeRun,
  ScrapeRunRepository,
} from './scrape-run/scrape-run.repository';

describe('BatchService', () => {
  let nextRunId: number;
  let repository: {
    start: jest.Mock;
    claimPending: jest.Mock;
    succeed: jest.Mock;
    fail: jest.Mock;
    failInterrupted: jest.Mock;
  };

  const createService = (jobs: BatchJob[]) =>
    new BatchService(jobs, repository as unknown as ScrapeRunRepository);

  const queuePending = (...runs: ClaimedScrapeRun[]) => {
    runs.forEach((run) => repository.claimPending.mockResolvedValueOnce(run));
  };

  beforeEach(() => {
    nextRunId = 1;
    repository = {
      start: jest.fn(() => Promise.resolve(nextRunId++)),
      claimPending: jest.fn().mockResolvedValue(null),
      succeed: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn().mockResolvedValue(undefined),
      failInterrupted: jest.fn().mockResolvedValue(0),
    };
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('run (cron)', () => {
    it('이전 실행의 잡이 남아 있으면 새 실행을 건너뛴다', async () => {
      const pendingJobs: Array<() => void> = [];
      const firstJobRun = jest.fn().mockResolvedValue(undefined);
      const secondJobRun = jest.fn(
        () => new Promise<void>((resolve) => pendingJobs.push(resolve)),
      );
      const service = createService([
        { name: 'first', run: firstJobRun },
        { name: 'second', run: secondJobRun },
      ]);

      const firstRun = service.run();
      await new Promise((resolve) => setImmediate(resolve));
      const secondRun = service.run();
      await new Promise((resolve) => setImmediate(resolve));

      expect(firstJobRun).toHaveBeenCalledTimes(1);

      pendingJobs.forEach((resolve) => resolve());
      await Promise.all([firstRun, secondRun]);
    });

    it('실행이 끝나면 다음 실행을 진행한다', async () => {
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([{ name: 'job', run: jobRun }]);

      await service.run();
      await service.run();

      expect(jobRun).toHaveBeenCalledTimes(2);
    });

    it('잡마다 cron run을 기록하고 성공 처리한다', async () => {
      const service = createService([
        { name: 'shuttle', run: jest.fn().mockResolvedValue(undefined) },
      ]);

      await service.run();

      expect(repository.start).toHaveBeenCalledWith('shuttle', 'cron', null);
      expect(repository.succeed).toHaveBeenCalledWith(1);
      expect(repository.fail).not.toHaveBeenCalled();
    });

    it('잡이 실패하면 run을 실패 처리하고 다음 잡을 실행한다', async () => {
      const nextJobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'failing',
          run: jest.fn().mockRejectedValue(new Error('fail')),
        },
        { name: 'next', run: nextJobRun },
      ]);

      await service.run();

      expect(repository.fail).toHaveBeenCalledWith(1, 'fail');
      expect(repository.succeed).toHaveBeenCalledWith(2);
      expect(nextJobRun).toHaveBeenCalledTimes(1);
    });

    it('같은 타입의 run이 이미 대기/실행 중이면 해당 잡을 건너뛴다', async () => {
      repository.start.mockResolvedValueOnce(null);
      const skippedJobRun = jest.fn().mockResolvedValue(undefined);
      const nextJobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        { name: 'skipped', run: skippedJobRun },
        { name: 'next', run: nextJobRun },
      ]);

      await service.run();

      expect(skippedJobRun).not.toHaveBeenCalled();
      expect(nextJobRun).toHaveBeenCalledTimes(1);
    });

    it('대상이 있는 잡은 대상마다 run을 기록하고 target을 넘겨 실행한다', async () => {
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'cafeteria',
          targets: jest.fn().mockResolvedValue(['1', '2']),
          run: jobRun,
        },
      ]);

      await service.run();

      expect(repository.start).toHaveBeenNthCalledWith(
        1,
        'cafeteria',
        'cron',
        '1',
      );
      expect(repository.start).toHaveBeenNthCalledWith(
        2,
        'cafeteria',
        'cron',
        '2',
      );
      expect(jobRun).toHaveBeenNthCalledWith(1, '1');
      expect(jobRun).toHaveBeenNthCalledWith(2, '2');
      expect(repository.succeed).toHaveBeenCalledTimes(2);
    });

    it('한 대상이 실패해도 run을 실패 처리하고 나머지 대상을 계속 실행한다', async () => {
      const jobRun = jest
        .fn()
        .mockRejectedValueOnce(new Error('표 없음'))
        .mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'cafeteria',
          targets: jest.fn().mockResolvedValue(['1', '2', '3']),
          run: jobRun,
        },
      ]);

      await service.run();

      expect(jobRun).toHaveBeenCalledTimes(3);
      expect(repository.fail).toHaveBeenCalledWith(1, '표 없음');
      expect(repository.succeed).toHaveBeenCalledWith(2);
      expect(repository.succeed).toHaveBeenCalledWith(3);
    });

    it('이미 대기/실행 중인 대상은 건너뛰고 나머지 대상을 실행한다', async () => {
      repository.start.mockResolvedValueOnce(null);
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'cafeteria',
          targets: jest.fn().mockResolvedValue(['1', '2']),
          run: jobRun,
        },
      ]);

      await service.run();

      expect(jobRun).toHaveBeenCalledTimes(1);
      expect(jobRun).toHaveBeenCalledWith('2');
    });

    it('대상 목록 조회가 실패하면 그 잡만 건너뛰고 다음 잡을 실행한다', async () => {
      const nextRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'cafeteria',
          targets: jest.fn().mockRejectedValue(new Error('db down')),
          run: jest.fn(),
        },
        { name: 'shuttle', run: nextRun },
      ]);

      await service.run();

      expect(nextRun).toHaveBeenCalledTimes(1);
      expect(repository.start).toHaveBeenCalledTimes(1);
      expect(repository.start).toHaveBeenCalledWith('shuttle', 'cron', null);
    });
  });

  describe('runPending (수동 실행)', () => {
    it('대기 중인 run을 모두 가져와 해당 잡을 실행한다', async () => {
      const shuttleRun = jest.fn().mockResolvedValue(undefined);
      const noticeRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        { name: 'shuttle', run: shuttleRun },
        { name: 'notice', run: noticeRun },
      ]);
      queuePending(
        { id: 10, type: 'shuttle', target: null },
        { id: 11, type: 'notice', target: null },
      );

      await service.runPending();

      expect(shuttleRun).toHaveBeenCalledTimes(1);
      expect(noticeRun).toHaveBeenCalledTimes(1);
      expect(repository.succeed).toHaveBeenCalledWith(10);
      expect(repository.succeed).toHaveBeenCalledWith(11);
    });

    it('잡이 실패해도 run을 실패 처리하고 다음 대기 run을 실행한다', async () => {
      const nextRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'shuttle',
          run: jest.fn().mockRejectedValue(new Error('boom')),
        },
        { name: 'notice', run: nextRun },
      ]);
      queuePending(
        { id: 10, type: 'shuttle', target: null },
        { id: 11, type: 'notice', target: null },
      );

      await service.runPending();

      expect(repository.fail).toHaveBeenCalledWith(10, 'boom');
      expect(nextRun).toHaveBeenCalledTimes(1);
      expect(repository.succeed).toHaveBeenCalledWith(11);
    });

    it('등록되지 않은 타입의 run은 실패 처리한다', async () => {
      const service = createService([]);
      queuePending({ id: 10, type: 'unknown', target: null });

      await service.runPending();

      expect(repository.fail).toHaveBeenCalledWith(
        10,
        '알 수 없는 잡 타입: unknown',
      );
    });

    it('이전 폴링이 진행 중이면 새 폴링을 건너뛴다', async () => {
      let release: () => void = () => undefined;
      const jobRun = jest.fn(
        () => new Promise<void>((resolve) => (release = resolve)),
      );
      const service = createService([{ name: 'shuttle', run: jobRun }]);
      queuePending({ id: 10, type: 'shuttle', target: null });

      const firstPoll = service.runPending();
      await new Promise((resolve) => setImmediate(resolve));
      await service.runPending();

      expect(repository.claimPending).toHaveBeenCalledTimes(1);

      release();
      await firstPoll;
    });

    it('target이 있는 대기 run은 target을 잡에 넘긴다', async () => {
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        { name: 'cafeteria', targets: jest.fn(), run: jobRun },
      ]);
      queuePending({ id: 20, type: 'cafeteria', target: '3' });

      await service.runPending();

      expect(jobRun).toHaveBeenCalledWith('3');
      expect(repository.succeed).toHaveBeenCalledWith(20);
    });

    it('target이 없는 대기 run은 target 없이 잡을 실행한다', async () => {
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([{ name: 'shuttle', run: jobRun }]);
      queuePending({ id: 21, type: 'shuttle', target: null });

      await service.runPending();

      expect(jobRun).toHaveBeenCalledWith(undefined);
    });
  });

  describe('onApplicationBootstrap', () => {
    it('중단된 run을 실패 처리한 뒤 cron 실행을 시작한다', async () => {
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([{ name: 'shuttle', run: jobRun }]);

      await service.onApplicationBootstrap();

      expect(repository.failInterrupted).toHaveBeenCalledTimes(1);
      expect(
        repository.failInterrupted.mock.invocationCallOrder[0],
      ).toBeLessThan(repository.start.mock.invocationCallOrder[0]);
      expect(jobRun).toHaveBeenCalledTimes(1);
    });
  });
});
