import type { ErrorEvent } from '@sentry/node';
import { scrubSentryEvent } from './scrub-sentry-event';

function adminEvent(): ErrorEvent {
  return {
    type: undefined,
    request: {
      url: 'https://admin.example.com/api/admin/auth/login',
      data: { email: 'a@b.c', password: 'secret-password' },
      cookies: { admin_session: 'token' },
      headers: { Cookie: 'admin_session=token', 'Content-Type': 'application/json' },
    },
  };
}

describe('scrubSentryEvent', () => {
  it('어드민 경로 요청의 본문, 쿠키, cookie 헤더를 지운다', () => {
    const result = scrubSentryEvent(adminEvent());

    expect(result.request?.data).toBeUndefined();
    expect(result.request?.cookies).toBeUndefined();
    expect(result.request?.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('소문자 cookie 헤더도 지운다', () => {
    const event = adminEvent();
    event.request!.headers = { cookie: 'a=b' };

    expect(scrubSentryEvent(event).request?.headers).toEqual({});
  });

  it('다른 경로는 그대로 둔다', () => {
    const event: ErrorEvent = {
      type: undefined,
      request: {
        url: 'https://api.example.com/api/user/me',
        data: { a: 1 },
        cookies: { c: 'd' },
        headers: { Cookie: 'c=d' },
      },
    };
    const before = JSON.parse(JSON.stringify(event));

    expect(scrubSentryEvent(event)).toEqual(before);
  });

  it('request가 없어도 그대로 돌려준다', () => {
    const event: ErrorEvent = { type: undefined };

    expect(scrubSentryEvent(event)).toBe(event);
  });
});
