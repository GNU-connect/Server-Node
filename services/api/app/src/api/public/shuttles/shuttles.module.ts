import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/type-orm/database.module';
import { ShuttleTimetable } from 'src/type-orm/entities/shuttle-timetables/shuttle-timetable.entity';
import { ShuttleTimetableRepository } from 'src/type-orm/entities/shuttle-timetables/shuttle-timetable.repository';
import { ShuttleMessagesService } from './shuttle-messages.service';
import { ShuttlesController } from './shuttles.controller';
import { ShuttlesNativeController } from './shuttles-native.controller';
import { ShuttlesService } from './shuttles.service';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([ShuttleTimetable])],
  controllers: [ShuttlesController, ShuttlesNativeController],
  providers: [ShuttlesService, ShuttleTimetableRepository, ShuttleMessagesService],
})
export class ShuttlesModule {}
