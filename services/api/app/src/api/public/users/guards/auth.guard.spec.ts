import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

const makeContext = (overrides: {
  path?: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
}): ExecutionContext => {
  const request = {
    path: overrides.path ?? '/api/notices/university',
    headers: overrides.headers ?? {},
    body: overrides.body ?? { userRequest: { user: {} } },
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
};

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
  });

  describe('공개 경로 (인증 제외)', () => {
    it('/api/health는 인증 없이 통과한다', () => {
      const ctx = makeContext({ path: '/api/health' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('/api/metrics는 인증 없이 통과한다', () => {
      const ctx = makeContext({ path: '/api/metrics' });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('헤더 기반 인증', () => {
    it('x-user-id 헤더가 있으면 true를 반환한다', () => {
      const ctx = makeContext({
        headers: { 'x-user-id': 'user-123' },
        body: { userRequest: { user: {} } },
      });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('x-user-id 헤더가 있으면 request.userId에 저장한다', () => {
      const request = {
        path: '/api/notices/university',
        headers: { 'x-user-id': 'user-123' },
        body: { userRequest: { user: {} } },
      };
      const ctx = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      guard.canActivate(ctx);

      expect(request['userId']).toBe('user-123');
    });
  });

  describe('바디 기반 인증', () => {
    it('body.userRequest.user.id가 있으면 true를 반환한다', () => {
      const ctx = makeContext({
        headers: {},
        body: { userRequest: { user: { id: 'kakao-user-id' } } },
      });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('body.userRequest.user.id가 있으면 request.userId에 저장한다', () => {
      const request = {
        path: '/api/notices/university',
        headers: {},
        body: { userRequest: { user: { id: 'kakao-user-id' } } },
      };
      const ctx = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      guard.canActivate(ctx);

      expect(request['userId']).toBe('kakao-user-id');
    });
  });

  describe('인증 실패', () => {
    it('헤더와 바디 모두 userId가 없으면 false를 반환한다', () => {
      const ctx = makeContext({
        headers: {},
        body: { userRequest: { user: {} } },
      });

      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('body에 userRequest가 없어도 false를 반환한다 (TypeError 없이)', () => {
      const ctx = makeContext({
        headers: {},
        body: { action: { clientExtra: {} } },
      });

      expect(() => guard.canActivate(ctx)).not.toThrow();
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('userId가 없으면 request.userId가 설정되지 않는다', () => {
      const request = {
        path: '/api/notices/university',
        headers: {},
        body: { userRequest: { user: {} } },
      };
      const ctx = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      guard.canActivate(ctx);

      expect(request['userId']).toBeUndefined();
    });
  });

  describe('헤더 우선순위', () => {
    it('헤더와 바디 모두 있으면 헤더의 userId를 사용한다', () => {
      const request = {
        path: '/api/notices/university',
        headers: { 'x-user-id': 'header-user' },
        body: { userRequest: { user: { id: 'body-user' } } },
      };
      const ctx = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      guard.canActivate(ctx);

      expect(request['userId']).toBe('header-user');
    });
  });
});
