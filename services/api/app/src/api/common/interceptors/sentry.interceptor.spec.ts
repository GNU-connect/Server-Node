import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { lastValueFrom, throwError } from 'rxjs';
import { SentryInterceptor } from './sentry.interceptor';

jest.mock('@sentry/node');

async function run(error: unknown): Promise<void> {
  const interceptor = new SentryInterceptor();
  const next = { handle: () => throwError(() => error) };
  await lastValueFrom(interceptor.intercept({} as never, next)).catch(() => undefined);
}

describe('SentryInterceptor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 같은 예상된 4xx HttpException은 Sentry로 보내지 않는다', async () => {
    await run(new UnauthorizedException('x'));
    await run(new BadRequestException('x'));
    await run(new HttpException('too many', 429));

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('5xx HttpException은 보낸다', async () => {
    const error = new InternalServerErrorException('x');
    await run(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('HttpException이 아닌 에러는 보낸다', async () => {
    const error = new Error('boom');
    await run(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
