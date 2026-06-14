import { Injectable } from '@nestjs/common';
import { BatchJob } from '../batch-job.interface';

@Injectable()
export class ShuttleJob implements BatchJob {
  readonly name = 'shuttle';

  constructor(
    private readonly client: ShuttleClient,
    private readonly parser: ShuttleParser,
    private readonly repository: ShuttleRepository,
  ) {}

  async run(): Promise<void> {}
}
