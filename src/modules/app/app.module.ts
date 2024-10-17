import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilsModule } from 'src/common/utils/utils.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { validationSchema } from 'src/common/utils/enviornment';
import { APP_FILTER } from '@nestjs/core';
import { CafeteriaModule } from '../cafeteria/cafeteria.module';
import { CommonModule } from '../common/common.module';
import { ClickerModule } from '../clicker/clicker.module';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    SupabaseModule,
    UtilsModule,
    CommonModule,
    UserModule,
    CafeteriaModule,
    ClickerModule,
    NewsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env.dev',
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
