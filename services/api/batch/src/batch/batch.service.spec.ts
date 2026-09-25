import { BatchService } from './batch.service';

describe('BatchService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('이전 실행의 잡이 남아 있으면 새 실행을 건너뛴다', async () => {
    const pendingJobs: Array<() => void> = [];
    const firstJobRun = jest.fn().mockResolvedValue(undefined);
    const secondJobRun = jest.fn(
      () => new Promise<void>((resolve) => pendingJobs.push(resolve)),
    );
    const service = new BatchService([
      { name: 'first', run: firstJobRun },
      { name: 'second', run: secondJobRun },
    ]);

    const firstRun = service.run();
    await new Promise((resolve) => process.nextTick(resolve));
    const secondRun = service.run();
    await new Promise((resolve) => process.nextTick(resolve));

    expect(firstJobRun).toHaveBeenCalledTimes(1);

    pendingJobs.forEach((resolve) => resolve());
    await Promise.all([firstRun, secondRun]);
  });

  it('실행이 끝나면 다음 실행을 진행한다', async () => {
    const jobRun = jest.fn().mockResolvedValue(undefined);
    const service = new BatchService([{ name: 'job', run: jobRun }]);

    await service.run();
    await service.run();

    expect(jobRun).toHaveBeenCalledTimes(2);
  });

  it('잡이 실패해도 다음 잡을 실행한다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const nextJobRun = jest.fn().mockResolvedValue(undefined);
    const service = new BatchService([
      { name: 'failing', run: jest.fn().mockRejectedValue(new Error('fail')) },
      { name: 'next', run: nextJobRun },
    ]);

    await service.run();

    expect(nextJobRun).toHaveBeenCalledTimes(1);
  });
});
