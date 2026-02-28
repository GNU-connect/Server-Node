import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';
import { DataSource } from 'typeorm';

const HEALTH_CHECK_INTERVAL_MS = 15_000;

@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectMetric('db_connection_up')
    private readonly dbConnectionUp: Gauge<string>,
  ) {}

  onModuleInit(): void {
    this.checkDatabase();
    this.intervalId = setInterval(() => this.checkDatabase(), HEALTH_CHECK_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async checkDatabase(): Promise<void> {
    try {
      await this.dataSource.query('SELECT 1');
      this.dbConnectionUp.set(1);
    } catch {
      this.dbConnectionUp.set(0);
    }
  }
}
