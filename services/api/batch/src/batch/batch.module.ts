import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BATCH_JOBS, BatchJob } from './jobs/batch-job.interface';
import { AcademicCalendarJob } from './jobs/academic-calendar/academic-calendar.job';
import { CafeteriaJob } from './jobs/cafeteria/cafeteria.job';
import { NoticeJob } from './jobs/notice/notice.job';
import { ShuttleJob } from './jobs/shuttle/shuttle.job';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    BatchService,
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
