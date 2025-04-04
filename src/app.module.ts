import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './common/database/database.module';
import { validationSchema } from 'src/common/utils/enviornment';
import { APP_FILTER } from '@nestjs/core';
import { ReadingRoomsModule } from './reading-rooms/reading-rooms.module';
import { HttpModule } from '@nestjs/axios';
import { HealthModule } from './health/health.module';
import { CampusesModule } from './campuses/campuses.module';
import { CollegesModule } from './colleges/colleges.module';
import { DepartmentsModule } from './departments/departments.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    HealthModule,
    HttpModule,
    DatabaseModule,
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
