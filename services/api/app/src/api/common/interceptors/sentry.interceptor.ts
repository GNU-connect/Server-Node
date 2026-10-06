import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      // tap은 next.handle()이 반환하는 Observable을 구독하고, 그 Observable이 값을 방출할 때마다 함수를 호출한다.
      tap({
        error: error => {
          // 로그인 실패, 401, 429, 검증 오류 같은 예상된 4xx는 보내지 않는다 (요청 본문이 딸려갈 수 있다)
          if (error instanceof HttpException && error.getStatus() < 500) return;
          Sentry.captureException(error);
        },
      }),
    );
  }
}
