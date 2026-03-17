import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/type-orm/database.module';
import { ShuttleTimetable } from 'src/type-orm/entities/shuttle-timetables/shuttle-timetable.entity';
import { ShuttleTimetableRepository } from 'src/type-orm/entities/shuttle-timetables/shuttle-timetable.repository';
import { ShuttlesController } from './shuttles.controller';
import { ShuttlesService } from './shuttles.service';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([ShuttleTimetable])],
  controllers: [ShuttlesController],
  providers: [ShuttlesService, ShuttleTimetableRepository],
})
export class ShuttlesModule {}
