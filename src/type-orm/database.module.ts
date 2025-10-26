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
        logging: process.env.NODE_ENV === 'production' ? 'all' : 'all',
        logger: 'advanced-console',
        poolSize: process.env.NODE_ENV === 'production' ? 5 : 1, // 풀 사이즈 조절
        maxQueryExecutionTime: 1000, // 롱 쿼리 로그 출력 시간
        retryAttempts: 2,
        retryDelay: 1000,
        extra: {
          max: 5, // 최대 연결 수
          connectionTimeoutMillis: 3000, // 최대 커넥션 대기 시간
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
