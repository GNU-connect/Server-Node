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
        logging: process.env.NODE_ENV === 'development',
        poolSize: process.env.NODE_ENV === 'production' ? 5 : 1, // 풀 사이즈 조절
        extra: {
          max: 20, // 최대 연결 수
          idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
          connectionTimeoutMillis: 2000, // 연결 타임아웃
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
export class SupabaseModule {}
