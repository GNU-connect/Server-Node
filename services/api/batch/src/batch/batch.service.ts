import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BATCH_JOBS, BatchJob } from './jobs/batch-job.interface';

@Injectable()
export class BatchService implements OnApplicationBootstrap {
  private readonly name = 'BatchService';
  private isRunning = false;

  constructor(
    @Inject(BATCH_JOBS)
    private readonly jobs: BatchJob[],
  ) {}

  @Cron('0 0 * * * *') // 매 정각마다 실행
  async run(): Promise<void> {
    if (this.isRunning) {
      console.warn(
        `[${this.name}] 이전 작업이 아직 완료되지 않았습니다. 이번 실행을 건너뜁니다.`,
      );
      return;
    }

    this.isRunning = true;

    for (const job of this.jobs) {
      try {
        await job.run();
      } catch (error) {
        // TODO: 에러 로깅 및 알림 시스템 연동
        console.error(
          `[${this.name}] 잡 실행 중 에러 발생: ${job.name}`,
          error,
        );
      } finally {
        this.isRunning = false;
      }
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.run();
  }
}
