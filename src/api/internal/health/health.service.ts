import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly httpService: HttpService) {}

  @Cron('*/1 * * * *', {
    name: 'health-check',
    timeZone: 'Asia/Seoul',
    disabled: process.env.NODE_ENV !== 'production',
  }) // 1분마다 실행
  async handleHealthCheck() {
    try {
      const port = process.env.NODE_ENV === 'production' ? 5200 : 5001;
      await this.httpService.axiosRef.get(
        `http://localhost:${port}/api/node/health`,
      );
    } catch (error) {
      this.logger.error('Health check failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }
  }
}
