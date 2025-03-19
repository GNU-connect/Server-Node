import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilsModule } from 'src/modules/common/utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { validationSchema } from 'src/modules/common/utils/enviornment';
import { APP_FILTER } from '@nestjs/core';
import { CommonModule } from '../common/common.module';
import { ClickersModule } from '../clickers/clickers.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ScheduleModule.forRoot(),
    HttpModule,
    SupabaseModule,
    UtilsModule,
    CommonModule,
    UsersModule,
    ClickersModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
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
