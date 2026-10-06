import { CookieOptions } from 'express';
import { SESSION_TTL_MS } from 'src/api/admin/auth/application/admin-auth.service';

export const ADMIN_SESSION_COOKIE = 'admin_session';

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    // 로컬 개발은 http라서 운영에서만 Secure를 켠다
    secure: process.env.NODE_ENV === 'production',
    path: '/api/admin',
    maxAge: SESSION_TTL_MS,
  };
}

/** clearCookie는 설정할 때와 같은 경로·속성이어야 지워진다 */
export function clearCookieOptions(): CookieOptions {
  const options = sessionCookieOptions();
  delete options.maxAge;
  return options;
}
