import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { IncomingWebhook } from '@slack/client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      // tap은 next.handle()이 반환하는 Observable을 구독하고, 그 Observable이 값을 방출할 때마다 함수를 호출한다.
      tap({
        error: (error) => {
          Sentry.captureException(error);
          const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK);
          webhook.send({
            attachments: [
              {
                color: 'danger',
                text: `🚨${process.env.NODE_ENV} API 서버 버그 발생🚨`,
                fields: [
                  {
                    title: `Request Message: ${error.message}`,
                    value: error.stack,
                    short: true,
                  },
                ],
                ts: Math.floor(new Date().getTime() / 1000).toString(),
              },
            ],
          });
        },
      }),
    );
  }
}
