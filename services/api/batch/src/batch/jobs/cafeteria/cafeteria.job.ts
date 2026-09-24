import { Injectable } from '@nestjs/common';
import { BatchJob } from '../batch-job.interface';

@Injectable()
export class CafeteriaJob implements BatchJob {
  readonly name = 'cafeteria';

  async run(): Promise<void> {}
}
