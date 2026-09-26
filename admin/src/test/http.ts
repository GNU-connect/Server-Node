import type { Mock } from 'vitest';

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** 서버의 NativeResponseDto 형태로 감싼 성공 응답 */
export function ok<T>(data: T, status = 200): Response {
  return jsonResponse(status, { statusCode: status, message: 'OK', data });
}

export function mockFetch(): Mock {
  const fn = vi.fn();
  vi.stubGlobal('fetch', fn);
  return fn;
}

type Handler = (url: URL, init?: RequestInit) => Response | Promise<Response>;

/** "METHOD /path" 키로 응답을 고른다. 등록 안 된 요청은 500. */
export function routeFetch(routes: Record<string, Handler>): Mock {
  return mockFetch().mockImplementation(async (input: string, init?: RequestInit) => {
    const url = new URL(input, 'http://localhost');
    const key = `${init?.method ?? 'GET'} ${url.pathname}`;
    const handler = routes[key];
    if (!handler) return jsonResponse(500, { statusCode: 500, message: `처리 안 된 요청: ${key}` });
    return handler(url, init);
  });
}

/** fetch 호출 중 경로가 prefix로 시작하는 것만 센다 */
export function callsTo(fetchMock: Mock, method: string, prefix: string): Array<[string, RequestInit]> {
  return fetchMock.mock.calls.filter(
    ([input, init]) => (init?.method ?? 'GET') === method && String(input).startsWith(prefix),
  ) as Array<[string, RequestInit]>;
}
