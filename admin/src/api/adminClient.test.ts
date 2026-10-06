import { jsonResponse, mockFetch, ok } from '../test/http';
import { makeRun } from '../test/fixtures';
import {
  getMe,
  getScrapeRun,
  getScraperStatuses,
  listScrapeRuns,
  login,
  logout,
  requestScrapeRun,
} from './adminClient';
import {
  ApiError,
  ConflictError,
  NetworkError,
  UnauthorizedError,
  errorText,
} from './errors';

describe('adminClient', () => {
  it('쿠키를 함께 보내 /api/admin/scrapers를 부르고 data를 꺼낸다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok([]));

    await expect(getScraperStatuses()).resolves.toEqual([]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/scrapers');
    expect(init.credentials).toBe('same-origin');
    expect(init.headers['x-admin-api-key']).toBeUndefined();
  });

  it('목록 조회는 값이 있는 파라미터만 쿼리로 보낸다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok({ items: [], nextCursor: null }));

    await listScrapeRuns({ type: 'cafeteria', status: undefined, cursor: 40, limit: 20 });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/scrape-runs?type=cafeteria&cursor=40&limit=20');
  });

  it('파라미터가 없으면 쿼리 문자열을 붙이지 않는다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok({ items: [], nextCursor: null }));

    await listScrapeRuns();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/scrape-runs');
  });

  it('단건 조회는 id를 경로에 넣는다', async () => {
    const run = makeRun({ id: 7 });
    const fetchMock = mockFetch().mockResolvedValue(ok(run));

    await expect(getScrapeRun(7)).resolves.toEqual(run);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/scrape-runs/7');
  });

  it('수동 실행은 JSON 본문으로 POST 하고 등록된 run 목록을 돌려준다', async () => {
    const run = makeRun({ status: 'pending', trigger: 'manual' });
    const fetchMock = mockFetch().mockResolvedValue(ok({ runs: [run] }, 202));

    await expect(requestScrapeRun('shuttle')).resolves.toEqual([run]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/scrape-runs');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ type: 'shuttle' });
  });

  it('대상을 지정한 수동 실행은 target도 본문에 담는다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok({ runs: [] }, 202));

    await requestScrapeRun('cafeteria', '3');

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ type: 'cafeteria', target: '3' });
  });

  it('목록 조회는 target도 쿼리로 보낸다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok({ items: [], nextCursor: null }));

    await listScrapeRuns({ type: 'cafeteria', target: '3' });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/scrape-runs?type=cafeteria&target=3');
  });

  it.each([401, 403])('%i 응답은 UnauthorizedError', async status => {
    mockFetch().mockResolvedValue(jsonResponse(status, { statusCode: status, message: 'Forbidden resource' }));

    const error = await getScraperStatuses().catch(e => e);

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.status).toBe(status);
  });

  it('409 응답은 서버 메시지를 담은 ConflictError', async () => {
    mockFetch().mockResolvedValue(
      jsonResponse(409, { statusCode: 409, message: "'shuttle' 수집이 이미 대기 또는 실행 중입니다." }),
    );

    const error = await requestScrapeRun('shuttle').catch(e => e);

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.message).toBe("'shuttle' 수집이 이미 대기 또는 실행 중입니다.");
  });

  it('검증 오류처럼 message가 배열이면 이어 붙인다', async () => {
    mockFetch().mockResolvedValue(
      jsonResponse(400, { statusCode: 400, message: ['type must be one of', 'limit must not be greater than 100'] }),
    );

    const error = await listScrapeRuns().catch(e => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('type must be one of, limit must not be greater than 100');
  });

  it('JSON이 아닌 5xx(프록시 오류 등)는 HTTP 상태를 담은 ApiError', async () => {
    mockFetch().mockResolvedValue(new Response('Bad Gateway', { status: 502 }));

    const error = await getScraperStatuses().catch(e => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(UnauthorizedError);
    expect(error.status).toBe(502);
    expect(error.message).toBe('HTTP 502');
  });

  it('fetch 자체가 실패하면 NetworkError', async () => {
    mockFetch().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getScraperStatuses()).rejects.toBeInstanceOf(NetworkError);
  });
});

describe('errorText', () => {
  it('에러 종류별로 사용자에게 보일 문장을 만든다', () => {
    expect(errorText(new NetworkError())).toBe(
      '서버에 연결하지 못했어요. 서버가 켜져 있는지 확인해 주세요.',
    );
    expect(errorText(new ApiError(500, 'HTTP 500'))).toBe(
      '요청이 실패했어요(HTTP 500). 잠시 뒤 다시 시도해 주세요.',
    );
    expect(errorText(new Error('boom'))).toBe(
      '알 수 없는 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.',
    );
  });

  it('로그인은 이메일과 비밀번호를 JSON으로 POST 하고 사용자를 돌려준다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok({ email: 'admin@example.com' }));

    await expect(login('admin@example.com', 'pw-123456')).resolves.toEqual({ email: 'admin@example.com' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'admin@example.com', password: 'pw-123456' });
  });

  it('로그인 상태 확인과 로그아웃 경로', async () => {
    const fetchMock = mockFetch()
      .mockResolvedValueOnce(ok({ email: 'admin@example.com' }))
      .mockResolvedValueOnce(ok(null));

    await getMe();
    await logout();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/auth/me');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/admin/auth/logout');
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
  });

  it('잠긴 계정(429)은 서버 문구를 담은 ApiError로 던진다', async () => {
    mockFetch().mockResolvedValue(
      jsonResponse(429, { statusCode: 429, message: '로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요.' }),
    );

    const error = await login('admin@example.com', 'pw-123456').catch(e => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(UnauthorizedError);
    expect(error.message).toBe('로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요.');
  });
});
