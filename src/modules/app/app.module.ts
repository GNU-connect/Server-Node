import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilsModule } from 'src/modules/common/utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { validationSchema } from 'src/modules/common/utils/enviornment';
import { APP_FILTER } from '@nestjs/core';
import { CommonModule } from '../common/common.module';
import { ReadingRoomsModule } from '../reading-rooms/reading-rooms.module';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/modules/auth/auth.module';
import { HealthModule } from '../health/health.module';
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
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
      validationSchema,
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AppService,
  ],
})
export class AppModule {}
