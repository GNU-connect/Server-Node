import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminApiKeyGuard } from 'src/api/admin/common/guards/admin-api-key.guard';

function createContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

function createGuard(apiKey: string | undefined): AdminApiKeyGuard {
  return new AdminApiKeyGuard({ get: () => apiKey } as unknown as ConfigService);
}

describe('AdminApiKeyGuard', () => {
  it('헤더의 키가 일치하면 통과시킨다', () => {
    const guard = createGuard('secret');

    expect(guard.canActivate(createContext({ 'x-admin-api-key': 'secret' }))).toBe(true);
  });

  it('헤더의 키가 다르거나 없으면 막는다', () => {
    const guard = createGuard('secret');

    expect(guard.canActivate(createContext({ 'x-admin-api-key': 'wrong' }))).toBe(false);
    expect(guard.canActivate(createContext({}))).toBe(false);
  });

  it('ADMIN_API_KEY가 설정되지 않았으면 항상 막는다', () => {
    const guard = createGuard(undefined);

    expect(guard.canActivate(createContext({ 'x-admin-api-key': '' }))).toBe(false);
  });
});
