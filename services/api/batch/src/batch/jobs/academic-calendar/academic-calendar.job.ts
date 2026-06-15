import { Injectable } from '@nestjs/common';
import { BatchJob } from '../batch-job.interface';

@Injectable()
export class AcademicCalendarJob implements BatchJob {
  readonly name = 'academic-calendar';

  async run(): Promise<void> {}
}
