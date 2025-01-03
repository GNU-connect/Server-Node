import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.dev' });
import * as process from 'process';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { KakaoInterceptor } from './interceptors/kakao.interceptor';
import { ResponseDTO } from './common/dto/response.dto';
import { SentryInterceptor } from './interceptors/sentry.interceptor.js';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv == 'prod') {
    Sentry.init({
      dsn: process.env.SENTRY_NODE_DSN,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });
    app.useGlobalInterceptors(
      new SentryInterceptor(),
    )
  }

  app.setGlobalPrefix('api/node');
  app.useGlobalInterceptors(
    new KakaoInterceptor(ResponseDTO)
  );

  const config = new DocumentBuilder()
    .setTitle('커넥트지누 노드 서버 API')
    .setDescription('커넥트지누 노드 서버 API 문서입니다.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);
  await app.listen(nodeEnv == 'prod' ? 5200 : 5000);
}

bootstrap();
