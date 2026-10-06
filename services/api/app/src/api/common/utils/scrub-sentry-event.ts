import type { ErrorEvent } from '@sentry/node';

const ADMIN_PATH = '/api/admin/';

/** 어드민 요청에는 비밀번호와 세션 쿠키가 실려 있으므로 Sentry로 보내기 전에 지운다. */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  const request = event.request;
  if (!request?.url?.includes(ADMIN_PATH)) return event;

  delete request.data;
  delete request.cookies;
  if (request.headers) {
    for (const name of Object.keys(request.headers)) {
      if (name.toLowerCase() === 'cookie') delete request.headers[name];
    }
  }
  return event;
}
