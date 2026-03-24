import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  getDataSourceByName,
} from 'typeorm-transactional';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        synchronize: false,
        entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
        logging: configService.get('NODE_ENV') === 'production' ? ['error', 'warn'] : 'all',
        logger: 'advanced-console',
        maxQueryExecutionTime: 1000, // 롱 쿼리 로그 출력 시간
        retryAttempts: 5,
        retryDelay: 1000,
        extra: {
          max: 10, // 최대 커넥션 수 (default: 10)
          min: 1, // 최소 커넥션 수 (default: 0)
          connectionTimeoutMillis: 3000, // 커넥션 타임아웃 시간 (default: 0ms, 무제한)
          idleTimeoutMillis: 30000, // 유휴 커넥션 유지 시간 (default: 10000ms)
          query_timeout: 2000, // 쿼리 타임아웃 시간 (default: 0ms, 무제한)
          statement_timeout: 1800, // 스테이트먼트 타임아웃 시간 (default: 0ms, 무제한)
        },
      }),
      async dataSourceFactory(options) {
        if (!options) throw new Error('Invalid options passed');

        return (
          getDataSourceByName('default') ||
          addTransactionalDataSource(new DataSource(options))
        );
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class DatabaseModule {}
