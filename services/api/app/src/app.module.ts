import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'src/infrastructure/logger/logger.module';
import { CafeteriasModule } from 'src/api/public/cafeterias/cafeterias.module';
import { CampusesModule } from './api/public/campuses/campuses.module';
import { CollegesModule } from './api/public/colleges/colleges.module';
import { DepartmentsModule } from './api/public/departments/departments.module';
import { UsersModule } from './api/public/users/users.module';
import { DatabaseModule } from './infrastructure/type-orm/database.module';
import { NoticesModule } from './api/public/notices/notices.module';
import { SchedulesModule } from './api/public/schedules/schedules.module';
import { ShuttlesModule } from './api/public/shuttles/shuttles.module';
import { HealthModule } from './api/internal/health/health.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    LoggerModule,
    CacheModule.register({ isGlobal: true, ttl: 60 * 60 * 1000 }),
    DatabaseModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CampusesModule,
    CollegesModule,
    DepartmentsModule,
    CafeteriasModule,
    NoticesModule,
    SchedulesModule,
    ShuttlesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
