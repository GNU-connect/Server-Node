import { Module } from '@nestjs/common';
import { CommonMessagesService } from 'src/api/public/message-templates/common-messages.service';
import { ScheduleMessagesService } from 'src/api/public/message-templates/schedule-messages.service';
import { AcademicCalendarsRepositoryModule } from 'src/type-orm/entities/academic-calendars/academic-calendars-repository.module';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from 'src/api/public/schedules/schedules.controller';

@Module({
  imports: [AcademicCalendarsRepositoryModule],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    ScheduleMessagesService,
    CommonMessagesService,
  ],
  exports: [SchedulesService],
})
export class SchedulesModule {}
