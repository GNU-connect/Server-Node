import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { ShuttleTimetable } from './jobs/shuttle/domain/shuttle-timetable.entity';
import { BATCH_JOBS, BatchJob } from './jobs/batch-job.interface';
import { AcademicCalendar } from './jobs/academic-calendar/domain/academic-calendar.entity';
import { AcademicCalendarClient } from './jobs/academic-calendar/academic-calendar.client';
import { AcademicCalendarJob } from './jobs/academic-calendar/academic-calendar.job';
import { AcademicCalendarParser } from './jobs/academic-calendar/academic-calendar.parser';
import { AcademicCalendarRepository } from './jobs/academic-calendar/academic-calendar.repository';
import { Cafeteria } from './jobs/cafeteria/domain/cafeteria.entity';
import { CafeteriaDiet } from './jobs/cafeteria/domain/cafeteria-diet.entity';
import { CafeteriaClient } from './jobs/cafeteria/cafeteria.client';
import { CafeteriaJob } from './jobs/cafeteria/cafeteria.job';
import { CafeteriaParser } from './jobs/cafeteria/cafeteria.parser';
import { CafeteriaRepository } from './jobs/cafeteria/cafeteria.repository';
import { Notice } from './jobs/notice/domain/notice.entity';
import { NoticeCategory } from './jobs/notice/domain/notice-category.entity';
import { NoticeClient } from './jobs/notice/notice.client';
import { NoticeParser } from './jobs/notice/notice.parser';
import { NoticeRepository } from './jobs/notice/notice.repository';
import { UniversityNoticeJob } from './jobs/notice/university-notice.job';
import { FetchHttpClient } from './http/fetch-http.client';
import { ShuttleClient } from './jobs/shuttle/shuttle.client';
import { ShuttleJob } from './jobs/shuttle/shuttle.job';
import { ShuttleParser } from './jobs/shuttle/shuttle.parser';
import { ShuttleRepository } from './jobs/shuttle/shuttle.repository';
import { ScrapeRun } from './scrape-run/domain/scrape-run.entity';
import { ScrapeRunRepository } from './scrape-run/scrape-run.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([
      ShuttleTimetable,
      ScrapeRun,
      AcademicCalendar,
      Cafeteria,
      CafeteriaDiet,
      Notice,
      NoticeCategory,
    ]),
  ],
  providers: [
    BatchService,
    ScrapeRunRepository,
    FetchHttpClient,
    ShuttleClient,
    ShuttleParser,
    ShuttleRepository,
    ShuttleJob,
    CafeteriaClient,
    CafeteriaParser,
    CafeteriaRepository,
    CafeteriaJob,
    NoticeClient,
    NoticeParser,
    NoticeRepository,
    UniversityNoticeJob,
    AcademicCalendarClient,
    AcademicCalendarParser,
    AcademicCalendarRepository,
    AcademicCalendarJob,
    {
      provide: BATCH_JOBS,
      useFactory: (...jobs: BatchJob[]): BatchJob[] => jobs,
      inject: [
        ShuttleJob,
        CafeteriaJob,
        UniversityNoticeJob,
        AcademicCalendarJob,
      ],
    },
  ],
})
export class BatchModule {}
