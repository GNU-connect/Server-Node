import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { FETCH_CURRENT_USER_KEY } from 'src/api/public/users/decorators/fetch-current-user.decorator';
import { UsersService } from 'src/api/public/users/users.service';
import { CurrentUserInterceptor } from './current-user.interceptor';

const makeContext = (overrides: {
  headers?: Record<string, string>;
  body?: Record<string, any>;
  shouldFetch?: boolean;
}): ExecutionContext => {
  const request = {
    headers: overrides.headers ?? {},
    body: overrides.body ?? {},
  };
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    _request: request,
  } as unknown as ExecutionContext;
};

const makeCallHandler = (): CallHandler => ({
  handle: jest.fn().mockReturnValue(of(null)),
});

describe('CurrentUserInterceptor', () => {
  let interceptor: CurrentUserInterceptor;
  let usersService: jest.Mocked<UsersService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    usersService = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    interceptor = new CurrentUserInterceptor(usersService, reflector);
  });

  describe('@FetchCurrentUser() 없는 경우', () => {
    it('유저 조회 없이 next.handle()을 호출한다', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const ctx = makeContext({});
      const next = makeCallHandler();

      await interceptor.intercept(ctx, next);

      expect(usersService.findOne).not.toHaveBeenCalled();
      expect(next.handle).toHaveBeenCalled();
    });

    it('req.currentUser가 설정되지 않는다', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const ctx = makeContext({ headers: { 'x-user-id': 'user-123' } });

      await interceptor.intercept(ctx, makeCallHandler());

      const req = ctx.switchToHttp().getRequest();
      expect(req.currentUser).toBeUndefined();
    });
  });

  describe('@FetchCurrentUser() 있는 경우', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(true);
    });

    it('Reflector가 FETCH_CURRENT_USER_KEY로 조회한다', async () => {
      const ctx = makeContext({});
      await interceptor.intercept(ctx, makeCallHandler());

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        FETCH_CURRENT_USER_KEY,
        [ctx.getHandler(), ctx.getClass()],
      );
    });

    describe('헤더 기반 userId', () => {
      it('DB에서 유저를 찾으면 req.currentUser에 설정한다', async () => {
        const user = { id: 'user-123', campus: { id: 1 }, department: null };
        usersService.findOne.mockResolvedValue(user as any);

        const ctx = makeContext({ headers: { 'x-user-id': 'user-123' } });
        await interceptor.intercept(ctx, makeCallHandler());

        const req = ctx.switchToHttp().getRequest();
        expect(usersService.findOne).toHaveBeenCalledWith('user-123');
        expect(req.currentUser).toBe(user);
      });

      it('DB에서 유저를 못 찾으면 fallback 객체를 설정한다', async () => {
        usersService.findOne.mockResolvedValue(null);

        const ctx = makeContext({ headers: { 'x-user-id': 'user-123' } });
        await interceptor.intercept(ctx, makeCallHandler());

        const req = ctx.switchToHttp().getRequest();
        expect(req.currentUser).toEqual({
          id: 'user-123',
          campus: null,
          department: null,
        });
      });
    });

    describe('바디 기반 userId', () => {
      it('body.userRequest.user.id로 유저를 조회한다', async () => {
        const user = { id: 'kakao-id', campus: null, department: null };
        usersService.findOne.mockResolvedValue(user as any);

        const ctx = makeContext({
          headers: {},
          body: { userRequest: { user: { id: 'kakao-id' } } },
        });
        await interceptor.intercept(ctx, makeCallHandler());

        expect(usersService.findOne).toHaveBeenCalledWith('kakao-id');
      });
    });

    describe('헤더 우선순위', () => {
      it('헤더와 바디 모두 있으면 헤더의 userId를 사용한다', async () => {
        usersService.findOne.mockResolvedValue(null);

        const ctx = makeContext({
          headers: { 'x-user-id': 'header-user' },
          body: { userRequest: { user: { id: 'body-user' } } },
        });
        await interceptor.intercept(ctx, makeCallHandler());

        expect(usersService.findOne).toHaveBeenCalledWith('header-user');
      });
    });

    describe('userId 없는 경우', () => {
      it('userId가 없으면 유저 조회를 하지 않는다', async () => {
        const ctx = makeContext({
          headers: {},
          body: { userRequest: { user: {} } },
        });
        await interceptor.intercept(ctx, makeCallHandler());

        expect(usersService.findOne).not.toHaveBeenCalled();
      });

      it('req.currentUser가 설정되지 않는다', async () => {
        const ctx = makeContext({ headers: {}, body: {} });
        await interceptor.intercept(ctx, makeCallHandler());

        const req = ctx.switchToHttp().getRequest();
        expect(req.currentUser).toBeUndefined();
      });
    });

    describe('findOne 예외 발생', () => {
      it('findOne이 throw하면 fallback 객체를 설정한다', async () => {
        usersService.findOne.mockRejectedValue(new Error('DB error'));

        const ctx = makeContext({ headers: { 'x-user-id': 'user-123' } });
        await interceptor.intercept(ctx, makeCallHandler());

        const req = ctx.switchToHttp().getRequest();
        expect(req.currentUser).toEqual({
          id: 'user-123',
          campus: null,
          department: null,
        });
      });
    });
  });
});
