import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BatchModule } from './batch/batch.module';

async function bootstrap() {
  // HTTP 서버가 없어 listen()이 호출되지 않으므로, useLogger 시점에 버퍼 로그를
  // 자동 flush하는 createApplicationContext를 사용한다.
  const app = await NestFactory.createApplicationContext(BatchModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  await app.init();
}

bootstrap().catch((error) => {
  new Logger('Bootstrap').error(
    '배치 애플리케이션 실행 중 에러 발생',
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exit(1);
});
