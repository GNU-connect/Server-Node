import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as process from 'process';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { HttpExceptionFilter } from './api/common/filters/http-exception.filter';
import { SentryFilter } from './api/common/filters/sentry.filter';
import { SentryInterceptor } from './api/common/interceptors/sentry.interceptor';
import { AppModule } from './app.module';
import './instrument';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const nodeEnv = process.env.NODE_ENV;

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  if (nodeEnv == 'production') {
    app.useGlobalInterceptors(new SentryInterceptor());
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryFilter(httpAdapter));
  } else {
    app.useGlobalFilters(new HttpExceptionFilter());
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

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
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1,
    },
  });

  app.use((req, res, next) => {
    const start = Date.now();
    const id = Math.random().toString(36).slice(2, 8);
    const ts = () => new Date().toISOString();

    console.log(`${ts()} [REQ ${id}] ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
      console.log(
        `${ts()} [FIN ${id}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
      );
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        console.log(
          `${ts()} [ABORT ${id}] ${req.method} ${req.originalUrl} ${Date.now() - start}ms`,
        );
      }
    });

    res.on('error', (err) => {
      console.error(
        `${ts()} [ERR ${id}] ${req.method} ${req.originalUrl}`,
        err,
      );
    });

    next();
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}

bootstrap();