import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'src/api/internal/logger/logger.module';
import { CafeteriasModule } from 'src/api/public/cafeterias/cafeterias.module';
import { HealthModule } from './api/internal/health/health.module';
import { CampusesModule } from './api/public/campuses/campuses.module';
import { CollegesModule } from './api/public/colleges/colleges.module';
import { DepartmentsModule } from './api/public/departments/departments.module';
import { ReadingRoomsModule } from './api/public/reading-rooms/reading-rooms.module';
import { UsersModule } from './api/public/users/users.module';
import { DatabaseModule } from './type-orm/database.module';
import { NoticesModule } from './api/public/notices/notices.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    LoggerModule,
    HealthModule,
    HttpModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    ReadingRoomsModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
    CampusesModule,
    CollegesModule,
    DepartmentsModule,
    CafeteriasModule,
    NoticesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule { }
