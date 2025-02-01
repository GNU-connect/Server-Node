import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'prod') {
      this.warmUpServer();
    }
  }

  // 서버를 Warm-up하기 위한 메서드
  async warmUpServer() {
    console.log('Running warm-up tasks...');

    const requestBody = {
      userRequest: {
        user: {
          id: '74f7e7ab2bf19e63bb1ec845b760631259d7615440a2d3db7b344ac48ed1bbcde5',
        },
      },
      action: {
        clientExtra: {
          sys_campus_id: '1',
        },
        params: {},
        detailParams: {},
      },
    };

    try {
      await this.callApi('/api/node/user/get/campus', requestBody);
      await this.callApi('/api/node/user/get/profile', requestBody);
      await this.callApi('/api/node/clicker/get/campus', requestBody);
      await this.callApi('/api/node/news/get/news', requestBody);

      console.log('All API calls are completed for warm-up.');
    } catch (error) {
      console.error('Error occurred during warm-up API calls:', error);
    }
  }

  // HTTP 요청을 보낼 함수
  private async callApi(apiUrl: string, body: any) {
    const baseUrl = 'https://connectgnu.kro.kr';

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}${apiUrl}`, body),
      );
      console.log(`${apiUrl} data fetched successfully`);
    } catch (error) {
      console.error(`${apiUrl} failed:`, error);
    }
  }

  // Cron을 이용한 주기적인 warm-up 호출
  @Cron('*/10 * * * *')
  handleCron() {
    if (process.env.NODE_ENV === 'prod') {
      console.log('Triggering server warm-up...');
      this.warmUpServer(); // warm-up 메서드를 호출
    }
  }
}
