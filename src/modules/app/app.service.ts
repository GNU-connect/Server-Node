import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DiscoveryService } from '@nestjs/core';
import { Cron } from '@nestjs/schedule';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly httpService: HttpService,
    private readonly discoverService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  public onModuleInit() {
    if (process.env.NODE_ENV === 'production') {
      this.warmUpServer();
    }
  }

  // Cron을 이용한 주기적인 warm-up 호출
  @Cron('*/10 * * * *')
  public handleCron() {
    if (process.env.NODE_ENV === 'production') {
      console.log('Triggering server warm-up...');
      this.warmUpServer(); // warm-up 메서드를 호출
    }
  }

  // 서버를 Warm-up하기 위한 메서드
  private async warmUpServer() {
    console.log('Running warm-up tasks...');

    const controllers = this.discoverService.getControllers();

    for (const controller of controllers) {
      const instance = controller.instance;
      const prototype = Object.getPrototypeOf(instance);

      // 컨트롤러의 모든 메소드를 순회
      const methods = Object.getOwnPropertyNames(prototype).filter(
        (method) => method !== 'constructor',
      );

      for (const method of methods) {
        const path = this.reflector.get('path', instance[method]);
        const httpMethod = this.reflector.get('method', instance[method]);

        if (path && httpMethod) {
          await this.callApi(path, this.getDefaultRequestBody());
        }
      }
    }
  }

  private getDefaultRequestBody() {
    return {
      userRequest: {
        user: {
          id: '74f7e7ab2bf19e63bb1ec845b760631259d7615440a2d3db7b344ac48ed1bbcde5',
        },
      },
      action: {
        clientExtra: {
          sys_campus_id: '1',
        },
      },
    };
  }

  // HTTP 요청을 보낼 함수
  private async callApi(apiUrl: string, body: any) {
    const baseUrl = 'https://connectgnu.kro.kr/';

    try {
      await firstValueFrom(this.httpService.post(`${baseUrl}${apiUrl}`, body));
      console.log(`${apiUrl} data fetched successfully`);
    } catch (error) {
      console.error(`${apiUrl} failed:`, error);
    }
  }
}
