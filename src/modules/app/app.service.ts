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

    // API 주소들을 호출
    try {
      await this.callApi('/api/node/user/get/campus');
      await this.callApi('/api/node/user/get/college');
      await this.callApi('/api/node/user/get/department');
      await this.callApi('/api/node/user/update/department');
      await this.callApi('/api/node/user/get/profile');
      await this.callApi('/api/node/clicker/get/campus');
      await this.callApi('/api/node/clicker/get/reading-room');
      await this.callApi('/api/node/clicker/get/reading-room-detail');
      await this.callApi('/api/node/news/get/news');

      console.log('All API calls are completed for warm-up.');
    } catch (error) {
      console.error('Error occurred during warm-up API calls:', error);
    }
  }

  // HTTP 요청을 보낼 함수
  private async callApi(apiUrl: string) {
    const baseUrl = 'https://connectgnu.kro.kr';

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}${apiUrl}`),
      );
      console.log(`${apiUrl} data fetched successfully`);
    } catch (error) {
      console.error(`${apiUrl} failed:`, error);
    }
  }

  // Cron을 이용한 주기적인 warm-up 호출
  @Cron('0 * * * *') // 매 정각마다 실행
  handleCron() {
    if (process.env.NODE_ENV === 'prod') {
      console.log('Triggering server warm-up...');
      this.warmUpServer(); // warm-up 메서드를 호출
    }
  }
}
