import './instrument';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.dev' });
import * as process from 'process';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { KakaoInterceptor } from './modules/interceptors/kakao.interceptor';
import { ResponseDTO } from './modules/common/dtos/response.dto';
import { SentryInterceptor } from './modules/interceptors/sentry.interceptor.js';
import { SentryFilter } from './modules/common/filters/sentry.filter';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './modules/common/filters/http-exception.filter';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule);
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv == 'production') {
    app.useGlobalInterceptors(new SentryInterceptor());
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryFilter(httpAdapter));
  } else {
    app.useGlobalFilters(new HttpExceptionFilter());
  }
  app.useGlobalInterceptors(new KakaoInterceptor(ResponseDTO));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: false,
    forbidNonWhitelisted: false,
    transform: true,
    //transformOptions: { enableImplicitConversion: true }
  }))


  app.setGlobalPrefix('api/node');
  const config = new DocumentBuilder()
    .setTitle('커넥트지누 노드 서버 API')
    .setDescription('커넥트지누 노드 서버 API 문서입니다.')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-USER-ID',
        in: 'header',
        description: 'userId를 입력하세요 (예: 123456)',
      },
      'X-USER-ID',
    )
    .addSecurityRequirements('X-USER-ID')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/node/docs', app, document,
    {
      swaggerOptions: {
        persistAuthorization: true, // 새로고침해도 인증 정보 유지
        defaultModelsExpandDepth: -1
      }
    }
  );
  await app.listen(nodeEnv == 'production' ? 5200 : 5001);
}

bootstrap();
