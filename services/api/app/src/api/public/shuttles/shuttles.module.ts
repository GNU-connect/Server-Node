import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShuttleTimetable } from 'src/api/public/shuttles/entities/shuttle-timetable.entity';
import { ShuttleTimetableRepository } from 'src/api/public/shuttles/shuttle-timetable.repository';
import { ShuttleMessageFactory } from './shuttle-message.factory';
import { ShuttleTimetableCalculator } from './shuttle-timetable.calculator';
import { ShuttlesController } from './shuttles.controller';
import { ShuttlesNativeController } from './shuttles-native.controller';
import { ShuttlesService } from './shuttles.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShuttleTimetable])],
  controllers: [ShuttlesController, ShuttlesNativeController],
  providers: [
    ShuttlesService,
    ShuttleTimetableRepository,
    ShuttleMessageFactory,
    ShuttleTimetableCalculator,
  ],
})
export class ShuttlesModule {}
