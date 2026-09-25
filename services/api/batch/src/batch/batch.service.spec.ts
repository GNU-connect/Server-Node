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

      expect(repository.start).toHaveBeenCalledWith('shuttle', 'cron');
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
  });

  describe('runPending (수동 실행)', () => {
    it('대기 중인 run을 모두 가져와 해당 잡을 실행한다', async () => {
      const shuttleRun = jest.fn().mockResolvedValue(undefined);
      const noticeRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        { name: 'shuttle', run: shuttleRun },
        { name: 'notice', run: noticeRun },
      ]);
      queuePending({ id: 10, type: 'shuttle' }, { id: 11, type: 'notice' });

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
      queuePending({ id: 10, type: 'shuttle' }, { id: 11, type: 'notice' });

      await service.runPending();

      expect(repository.fail).toHaveBeenCalledWith(10, 'boom');
      expect(nextRun).toHaveBeenCalledTimes(1);
      expect(repository.succeed).toHaveBeenCalledWith(11);
    });

    it('등록되지 않은 타입의 run은 실패 처리한다', async () => {
      const service = createService([]);
      queuePending({ id: 10, type: 'unknown' });

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
      queuePending({ id: 10, type: 'shuttle' });

      const firstPoll = service.runPending();
      await new Promise((resolve) => setImmediate(resolve));
      await service.runPending();

      expect(repository.claimPending).toHaveBeenCalledTimes(1);

      release();
      await firstPoll;
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
