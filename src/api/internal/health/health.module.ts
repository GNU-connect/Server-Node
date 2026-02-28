import { Module } from '@nestjs/common';
import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    makeGaugeProvider({
      name: 'db_connection_up',
      help: 'Database connection status (1 = up, 0 = down)',
    }),
  ],
})
export class HealthModule {}
