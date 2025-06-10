import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { RedisModule } from 'src/cache/redis.module';
import { validationSchema } from './api/common/utils/enviornment';
import { HealthModule } from './api/internal/health/health.module';
import { CampusesModule } from './api/public/campuses/campuses.module';
import { CollegesModule } from './api/public/colleges/colleges.module';
import { DepartmentsModule } from './api/public/departments/departments.module';
import { ReadingRoomsModule } from './api/public/reading-rooms/reading-rooms.module';
import { UsersModule } from './api/public/users/users.module';
import { DatabaseModule } from './type-orm/database.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    HealthModule,
    HttpModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    UsersModule,
    ReadingRoomsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
      validationSchema,
    }),
    CampusesModule,
    CollegesModule,
    DepartmentsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
