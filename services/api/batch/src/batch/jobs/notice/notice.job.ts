import { Injectable } from '@nestjs/common';
import { BatchJob } from '../batch-job.interface';

@Injectable()
export class NoticeJob implements BatchJob {
  readonly name = 'notice';

  async run(): Promise<void> {}
}
