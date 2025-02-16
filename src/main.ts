import './instrument';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.dev' });
import * as process from 'process';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { KakaoInterceptor } from './interceptors/kakao.interceptor';
import { ResponseDTO } from './common/dto/response.dto';
import { SentryInterceptor } from './interceptors/sentry.interceptor.js';
import { SentryFilter } from './common/filter/sentry.filter';
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule);
  const nodeEnv = process.env.NODE_ENV;

  app.useGlobalInterceptors(new SentryInterceptor());

  app.useGlobalInterceptors(new KakaoInterceptor(ResponseDTO));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));

  app.setGlobalPrefix('api/node');
  const config = new DocumentBuilder()
    .setTitle('커넥트지누 노드 서버 API')
    .setDescription('커넥트지누 노드 서버 API 문서입니다.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/node/docs', app, document);
  await app.listen(nodeEnv == 'production' ? 5200 : 5000);
}

bootstrap();
