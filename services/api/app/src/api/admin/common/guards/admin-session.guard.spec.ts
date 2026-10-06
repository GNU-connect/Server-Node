import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from 'src/api/admin/auth/application/admin-auth.service';
import { AdminSessionGuard } from './admin-session.guard';

function createContext(cookies: unknown) {
  const request: Record<string, unknown> = { cookies };
  const cookie = jest.fn();
  const context = {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({ cookie }) }),
  } as unknown as ExecutionContext;
  return { context, request, cookie };
}

function createGuard(validateSession: jest.Mock) {
  return new AdminSessionGuard({ validateSession } as unknown as AdminAuthService);
}

describe('AdminSessionGuard', () => {
  it.each([
    ['쿠키 객체가 없음', undefined],
    ['쿠키가 비어 있음', {}],
    ['빈 문자열', { admin_session: '' }],
    ['배열 값', { admin_session: ['a', 'b'] }],
    ['객체 값', { admin_session: { a: 1 } }],
  ])('%s이면 서비스에 묻지 않고 401', async (_name, cookies) => {
    const validateSession = jest.fn();
    const { context } = createContext(cookies);

    await expect(createGuard(validateSession).canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(validateSession).not.toHaveBeenCalled();
  });

  it('세션이 없거나 만료됐으면 401', async () => {
    const validateSession = jest.fn().mockResolvedValue(null);
    const { context } = createContext({ admin_session: 'token' });

    await expect(createGuard(validateSession).canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(validateSession).toHaveBeenCalledWith('token');
  });

  it('유효하면 통과시키고 요청에 adminUser를 붙인다(연장이 없으면 쿠키를 다시 내리지 않는다)', async () => {
    const adminUser = { id: 1, email: 'admin@example.com' };
    const validateSession = jest.fn().mockResolvedValue({ adminUser, renewedUntil: null });
    const { context, request, cookie } = createContext({ admin_session: 'token' });

    await expect(createGuard(validateSession).canActivate(context)).resolves.toBe(true);

    expect(request.adminUser).toEqual(adminUser);
    expect(cookie).not.toHaveBeenCalled();
  });

  it('세션이 연장됐으면 쿠키 만료도 24시간으로 다시 내린다', async () => {
    const validateSession = jest.fn().mockResolvedValue({
      adminUser: { id: 1, email: 'admin@example.com' },
      renewedUntil: new Date(),
    });
    const { context, cookie } = createContext({ admin_session: 'token' });

    await createGuard(validateSession).canActivate(context);

    expect(cookie).toHaveBeenCalledWith(
      'admin_session',
      'token',
      expect.objectContaining({ httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }),
    );
  });
});
