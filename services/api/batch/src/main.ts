import { NestFactory } from '@nestjs/core';
import { BatchModule } from './batch/batch.module';

async function bootstrap() {
  const app = await NestFactory.create(BatchModule);
  await app.init();
}

bootstrap().catch((error) => {
  console.error('[main] 배치 애플리케이션 실행 중 에러 발생:', error);
  process.exit(1);
});
