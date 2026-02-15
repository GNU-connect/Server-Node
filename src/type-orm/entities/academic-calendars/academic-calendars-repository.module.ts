import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicCalendar } from './academic-calendar.entity';
import { AcademicCalendarsRepository } from './academic-calendars.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicCalendar])],
  providers: [AcademicCalendarsRepository],
  exports: [AcademicCalendarsRepository],
})
export class AcademicCalendarsRepositoryModule {}
