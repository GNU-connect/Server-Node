import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShuttleTimetable } from 'src/api/public/shuttles/domain/entities/shuttle-timetable.entity';
import { ShuttleTimetableRepository } from 'src/api/public/shuttles/infrastructure/shuttle-timetable.repository';
import { ShuttleMessageFactory } from 'src/api/public/shuttles/presentation/shuttle-message.factory';
import { ShuttleTimetableCalculator } from 'src/api/public/shuttles/application/shuttle-timetable.calculator';
import { ShuttlesController } from 'src/api/public/shuttles/presentation/shuttles.controller';
import { ShuttlesNativeController } from 'src/api/public/shuttles/presentation/shuttles-native.controller';
import { ShuttlesService } from 'src/api/public/shuttles/application/shuttles.service';

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
