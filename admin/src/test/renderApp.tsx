import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes, ROUTER_FUTURE } from '../App';
import { AuthProvider } from '../auth/AuthContext';
import { jsonResponse, ok } from './http';

interface RenderAppOptions {
  /** 앱을 열 때 /auth/me가 성공한다 */
  loggedIn?: boolean;
  /** 앱을 열 때 /auth/me가 네트워크 오류로 실패한다 */
  meFails?: boolean;
}

/**
 * /auth/me 확인만 가로채고, 나머지 요청은 테스트가 먼저 심어 둔 fetch로 넘긴다.
 * 그래서 각 테스트의 fetchMock 호출 목록에는 로그인 확인 요청이 섞이지 않는다.
 */
export function renderApp(path: string, { loggedIn = false, meFails = false }: RenderAppOptions = {}) {
  const underlying = globalThis.fetch;
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === '/api/admin/auth/me') {
      if (meFails) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve(
        loggedIn
          ? ok({ email: 'admin@example.com' })
          : jsonResponse(401, { statusCode: 401, message: 'Unauthorized' }),
      );
    }
    return underlying(input, init);
  });
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
