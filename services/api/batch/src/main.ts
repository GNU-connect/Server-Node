import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BatchModule } from './batch/batch.module';

async function bootstrap() {
  const app = await NestFactory.create(BatchModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  await app.init();
}

bootstrap().catch((error) => {
  new Logger('Bootstrap').error('배치 애플리케이션 실행 중 에러 발생', error);
  process.exit(1);
});
