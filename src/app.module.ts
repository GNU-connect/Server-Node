import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { Module } from '@nestjs/common';
import { UtilsModule } from 'src/common/utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { SupabaseModule } from './supabase/supabase.module';
import { validationSchema } from 'src/common/utils/enviornment';
import { APP_FILTER } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { ReadingRoomsModule } from './reading-rooms/reading-rooms.module';
import { HttpModule } from '@nestjs/axios';
import { HealthModule } from './health/health.module';
@Module({
  imports: [
    SentryModule.forRoot(),
    HealthModule,
    HttpModule,
    SupabaseModule,
    UtilsModule,
    CommonModule,
    UsersModule,
    ReadingRoomsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
      validationSchema,
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
