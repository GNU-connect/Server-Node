import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class BatchService implements OnApplicationBootstrap {
  @Cron('0 0 * * * *') // 매 정각마다 실행
  async run(): Promise<void> {
    // 배치 작업 로직을 여기에 작성합니다.
    console.log('Batch 작업이 실행되었습니다.');
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.run();
  }
}
