import { Injectable } from '@nestjs/common';
import { BatchJob } from '../batch-job.interface';
import { ShuttleClient } from './shuttle.client';
import { ShuttleParser } from './shuttle.parser';
import { ShuttleRepository } from './shuttle.repository';

@Injectable()
export class ShuttleJob implements BatchJob {
  readonly name = 'shuttle';

  constructor(
    private readonly client: ShuttleClient,
    private readonly parser: ShuttleParser,
    private readonly repository: ShuttleRepository,
  ) {}

  async run(): Promise<void> {
    const raw = await this.client.fetch();
    const page = this.parser.parse(raw);
    const collectedAt = new Date();

    await this.repository.save(
      page.timetables.map(({ routeName, timetable }) => ({
        routeName,
        timetable,
        updatedAt: page.updatedAt,
        lastSuccessAt: collectedAt,
      })),
    );
  }
}
