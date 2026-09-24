import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BATCH_JOBS, BatchJob } from './jobs/batch-job.interface';
import { AcademicCalendarJob } from './jobs/academic-calendar/academic-calendar.job';
import { CafeteriaJob } from './jobs/cafeteria/cafeteria.job';
import { NoticeJob } from './jobs/notice/notice.job';
import { FetchHttpClient } from './http/fetch-http.client';
import { ShuttleClient } from './jobs/shuttle/shuttle.client';
import { ShuttleJob } from './jobs/shuttle/shuttle.job';
import { ShuttleParser } from './jobs/shuttle/shuttle.parser';
import { ShuttleRepository } from './jobs/shuttle/shuttle.repository';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    BatchService,
    FetchHttpClient,
    ShuttleClient,
    ShuttleParser,
    ShuttleRepository,
    ShuttleJob,
    CafeteriaJob,
    NoticeJob,
    AcademicCalendarJob,
    {
      provide: BATCH_JOBS,
      useFactory: (...jobs: BatchJob[]): BatchJob[] => jobs,
      inject: [ShuttleJob, CafeteriaJob, NoticeJob, AcademicCalendarJob],
    },
  ],
})
export class BatchModule {}
