import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { BATCH_JOBS, BatchJob } from './jobs/batch-job.interface';
import { ScrapeRunRepository } from './scrape-run/scrape-run.repository';

const MANUAL_RUN_POLL_INTERVAL_MS = 10_000;

@Injectable()
export class BatchService implements OnApplicationBootstrap {
  private readonly name = 'BatchService';
  private readonly jobsByName: Map<string, BatchJob>;
  private isRunning = false;
  private isPolling = false;

  constructor(
    @Inject(BATCH_JOBS)
    private readonly jobs: BatchJob[],
    private readonly scrapeRunRepository: ScrapeRunRepository,
  ) {
    this.jobsByName = new Map(jobs.map((job) => [job.name, job]));
  }

  @Cron('0 0 * * * *') // 매 정각마다 실행
  async run(): Promise<void> {
    if (this.isRunning) {
      console.warn(
        `[${this.name}] 이전 작업이 아직 완료되지 않았습니다. 이번 실행을 건너뜁니다.`,
      );
      return;
    }

    this.isRunning = true;

    try {
      for (const job of this.jobs) {
        try {
          const runId = await this.scrapeRunRepository.start(job.name, 'cron');
          if (runId === null) {
            console.warn(
              `[${this.name}] 이미 대기/실행 중인 run이 있어 건너뜁니다: ${job.name}`,
            );
            continue;
          }
          await this.execute(runId, job);
        } catch (error) {
          // TODO: 에러 로깅 및 알림 시스템 연동
          console.error(
            `[${this.name}] 잡 실행 중 에러 발생: ${job.name}`,
            error,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /** admin API로 요청된 수동 실행(pending run)을 가져와 실행한다. */
  @Interval(MANUAL_RUN_POLL_INTERVAL_MS)
  async runPending(): Promise<void> {
    if (this.isPolling) return;

    this.isPolling = true;

    try {
      let claimed = await this.scrapeRunRepository.claimPending();
      while (claimed) {
        const job = this.jobsByName.get(claimed.type);
        if (job) {
          try {
            await this.execute(claimed.id, job);
          } catch (error) {
            console.error(
              `[${this.name}] 수동 실행 잡 에러 발생: ${job.name}`,
              error,
            );
          }
        } else {
          await this.scrapeRunRepository.fail(
            claimed.id,
            `알 수 없는 잡 타입: ${claimed.type}`,
          );
        }
        claimed = await this.scrapeRunRepository.claimPending();
      }
    } catch (error) {
      console.error(`[${this.name}] 수동 실행 처리 중 에러 발생`, error);
    } finally {
      this.isPolling = false;
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    const interrupted = await this.scrapeRunRepository.failInterrupted();
    if (interrupted > 0) {
      console.warn(
        `[${this.name}] 중단된 run ${interrupted}건을 실패 처리했습니다.`,
      );
    }
    await this.run();
  }

  private async execute(runId: number, job: BatchJob): Promise<void> {
    try {
      await job.run();
    } catch (error) {
      await this.scrapeRunRepository.fail(runId, toErrorMessage(error));
      throw error;
    }
    await this.scrapeRunRepository.succeed(runId);
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
