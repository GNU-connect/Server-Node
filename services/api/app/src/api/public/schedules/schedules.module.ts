import { Module } from '@nestjs/common';
import { CommonMessageFactory } from 'src/api/public/common/common-message.factory';
import { ScheduleMessageFactory } from 'src/api/public/schedules/schedule-message.factory';
import { AcademicCalendarsRepositoryModule } from 'src/type-orm/entities/academic-calendars/academic-calendars-repository.module';
import { SchedulesController } from 'src/api/public/schedules/schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [AcademicCalendarsRepositoryModule],
  controllers: [SchedulesController],
  providers: [SchedulesService, ScheduleMessageFactory, CommonMessageFactory],
  exports: [SchedulesService],
})
export class SchedulesModule {}
