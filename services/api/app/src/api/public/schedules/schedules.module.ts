import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonMessageFactory } from 'src/api/public/common/presentation/common-message.factory';
import { AcademicCalendarsRepository } from 'src/api/public/schedules/infrastructure/academic-calendars.repository';
import { AcademicCalendar } from 'src/api/public/schedules/domain/entities/academic-calendar.entity';
import { ScheduleMessageFactory } from 'src/api/public/schedules/presentation/schedule-message.factory';
import { SchedulesKakaoController } from 'src/api/public/schedules/presentation/schedules-kakao.controller';
import { SchedulesService } from 'src/api/public/schedules/application/schedules.service';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicCalendar])],
  controllers: [SchedulesKakaoController],
  providers: [
    SchedulesService,
    AcademicCalendarsRepository,
    ScheduleMessageFactory,
    CommonMessageFactory,
  ],
  exports: [SchedulesService],
})
export class SchedulesModule {}
