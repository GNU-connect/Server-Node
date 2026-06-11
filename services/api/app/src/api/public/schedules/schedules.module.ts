import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonMessageFactory } from 'src/api/public/common/common-message.factory';
import { AcademicCalendarsRepository } from 'src/api/public/schedules/academic-calendars.repository';
import { AcademicCalendar } from 'src/api/public/schedules/entities/academic-calendar.entity';
import { ScheduleMessageFactory } from 'src/api/public/schedules/schedule-message.factory';
import { SchedulesController } from 'src/api/public/schedules/schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicCalendar])],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    AcademicCalendarsRepository,
    ScheduleMessageFactory,
    CommonMessageFactory,
  ],
  exports: [SchedulesService],
})
export class SchedulesModule {}
