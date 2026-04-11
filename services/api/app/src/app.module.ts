import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, HttpAdapterHost } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import {
  makeCounterProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { Server } from 'node:http';
import { LoggerModule } from 'src/api/internal/logger/logger.module';
import { CafeteriasModule } from 'src/api/public/cafeterias/cafeterias.module';
import { CampusesModule } from './api/public/campuses/campuses.module';
import { CollegesModule } from './api/public/colleges/colleges.module';
import { DepartmentsModule } from './api/public/departments/departments.module';
import { UsersModule } from './api/public/users/users.module';
import { DatabaseModule } from './type-orm/database.module';
import { NoticesModule } from './api/public/notices/notices.module';
import { SchedulesModule } from './api/public/schedules/schedules.module';
import { ShuttlesModule } from './api/public/shuttles/shuttles.module';
import { MetricsInterceptor } from './api/common/interceptors/metrics.interceptor';
import { HealthModule } from './api/internal/health/health.module';
import { WarmupModule } from './api/internal/warmup/warmup.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    LoggerModule,
    HttpModule,
    CacheModule.register({ isGlobal: true, ttl: 60 * 60 * 1000 }),
    PrometheusModule.register(),
    DatabaseModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
    CampusesModule,
    CollegesModule,
    DepartmentsModule,
    CafeteriasModule,
    NoticesModule,
    SchedulesModule,
    ShuttlesModule,
    HealthModule,
    WarmupModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    }),
    makeCounterProvider({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'path', 'status'],
    }),
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  onApplicationBootstrap() {
    const server = this.httpAdapterHost.httpAdapter.getHttpServer() as Server;

    server.keepAliveTimeout = 61 * 1000
    server.headersTimeout = 65 * 1000
  }
}
