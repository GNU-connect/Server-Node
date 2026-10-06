import {
  ADMIN_SESSION_COOKIE,
  clearCookieOptions,
  sessionCookieOptions,
} from './admin-session.cookie';

describe('admin session cookie', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('쿠키 이름은 admin_session', () => {
    expect(ADMIN_SESSION_COOKIE).toBe('admin_session');
  });

  it('HttpOnly, SameSite=Lax, /api/admin 경로, 24시간', () => {
    process.env.NODE_ENV = 'development';

    expect(sessionCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/api/admin',
      maxAge: 24 * 60 * 60 * 1000,
    });
  });

  it('운영에서만 Secure', () => {
    process.env.NODE_ENV = 'production';

    expect(sessionCookieOptions().secure).toBe(true);
  });

  it('쿠키를 지울 때는 경로 등은 같고 maxAge만 뺀다', () => {
    process.env.NODE_ENV = 'development';

    expect(clearCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/api/admin',
    });
  });
});
