import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BATCH_JOBS, BatchJob } from './jobs/batch-job.interface';

@Injectable()
export class BatchService implements OnApplicationBootstrap {
  constructor(
    @Inject(BATCH_JOBS)
    private readonly jobs: BatchJob[],
  ) {}

  @Cron('0 0 * * * *') // 매 정각마다 실행
  async run(): Promise<void> {
    for (const job of this.jobs) {
      await job.run();
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.run();
  }
}
