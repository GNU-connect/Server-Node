import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ScraperStatus } from '../api/types';
import { allStatuses, makeRun, makeStatus } from '../test/fixtures';
import { callsTo, jsonResponse, ok, routeFetch } from '../test/http';
import { renderApp } from '../test/renderApp';

function card(name: string) {
  return screen.getByRole('heading', { name, level: 3 }).closest('section') as HTMLElement;
}

describe('수집 상태 화면', () => {
  it('타입별 카드 4장과 최근 실행 표를 보여 준다', async () => {
    routeFetch({
      'GET /api/admin/scrapers': () => ok(allStatuses()),
      'GET /api/admin/scrape-runs': () => ok({ items: [makeRun({ id: 42 })], nextCursor: 41 }),
    });
    renderApp('/scrapers', { apiKey: 'k' });

    for (const name of ['셔틀', '학교 공지', '학식', '학사 일정']) {
      expect(await screen.findByRole('heading', { name, level: 3 })).toBeInTheDocument();
    }
    const recent = screen.getByRole('region', { name: '최근 실행' });
    expect(within(recent).getByText('42')).toBeInTheDocument();
    expect(within(recent).getByRole('link', { name: '실행 기록 전체 보기' })).toHaveAttribute(
      'href',
      '/scrape-runs',
    );
  });

  it('최근 실행은 10건만 요청한다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrapers': () => ok(allStatuses()),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
    });
    renderApp('/scrapers', { apiKey: 'k' });

    expect(await screen.findByText('아직 실행 기록이 없어요')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'GET', '/api/admin/scrape-runs')[0][0]).toBe(
      '/api/admin/scrape-runs?limit=10',
    );
  });

  it('실패한 수집이 있으면 맨 위에 모아서 알려 준다', async () => {
    routeFetch({
      'GET /api/admin/scrapers': () =>
        ok(
          allStatuses({
            cafeteria: makeStatus('cafeteria', makeRun({ type: 'cafeteria', status: 'failed' })),
            'university-notice': makeStatus(
              'university-notice',
              makeRun({ type: 'university-notice', status: 'failed' }),
            ),
          }),
        ),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
    });
    renderApp('/scrapers', { apiKey: 'k' });

    expect(
      await screen.findByText('학교 공지, 학식 수집이 실패했어요. 카드의 오류를 확인하고 다시 수집해 주세요.'),
    ).toBeInTheDocument();
  });

  it('지금 수집을 누르면 요청하고, 다시 불러와 수집 중으로 바꾼다', async () => {
    let statuses: ScraperStatus[] = allStatuses();
    const fetchMock = routeFetch({
      'GET /api/admin/scrapers': () => ok(statuses),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      'POST /api/admin/scrape-runs': () => {
        const pending = makeRun({ id: 200, status: 'pending', trigger: 'manual', startedAt: null, finishedAt: null });
        statuses = allStatuses({ shuttle: makeStatus('shuttle', pending, makeRun()) });
        return ok({ runs: [pending] }, 202);
      },
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await screen.findByRole('heading', { name: '셔틀', level: 3 });
    await user.click(within(card('셔틀')).getByRole('button', { name: '지금 수집' }));

    expect(await within(card('셔틀')).findByRole('button', { name: '수집 중…' })).toBeDisabled();
    const posts = callsTo(fetchMock, 'POST', '/api/admin/scrape-runs');
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0][1].body as string)).toEqual({ type: 'shuttle' });
  });

  it('지금 수집을 빠르게 두 번 눌러도 요청은 한 번만 보낸다', async () => {
    let release!: () => void;
    const fetchMock = routeFetch({
      'GET /api/admin/scrapers': () => ok(allStatuses()),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      'POST /api/admin/scrape-runs': () =>
        new Promise<Response>(resolve => {
          release = () => resolve(ok({ runs: [makeRun({ status: 'pending' })] }, 202));
        }),
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await screen.findByRole('heading', { name: '셔틀', level: 3 });
    const button = within(card('셔틀')).getByRole('button', { name: '지금 수집' });
    await user.click(button);
    await user.click(button);
    await act(async () => release());

    expect(callsTo(fetchMock, 'POST', '/api/admin/scrape-runs')).toHaveLength(1);
  });

  it('이미 수집 중(409)이면 카드 안에 안내한다', async () => {
    routeFetch({
      'GET /api/admin/scrapers': () => ok(allStatuses()),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      'POST /api/admin/scrape-runs': () =>
        jsonResponse(409, { statusCode: 409, message: "'university-notice' 수집이 이미 대기 또는 실행 중입니다." }),
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await screen.findByRole('heading', { name: '학교 공지', level: 3 });
    await user.click(within(card('학교 공지')).getByRole('button', { name: '지금 수집' }));

    expect(await within(card('학교 공지')).findByRole('status')).toHaveTextContent(
      '이미 수집이 대기 중이거나 실행 중이에요.',
    );
  });

  it('불러오기에 실패하면 안내와 다시 시도 버튼을 보여 준다', async () => {
    let fail = true;
    routeFetch({
      'GET /api/admin/scrapers': () =>
        fail ? new Response('Internal Server Error', { status: 500 }) : ok(allStatuses()),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '요청이 실패했어요(HTTP 500). 잠시 뒤 다시 시도해 주세요.',
    );
    fail = false;
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('heading', { name: '셔틀', level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('새로고침 버튼으로 바로 다시 불러온다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrapers': () => ok(allStatuses()),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await screen.findByRole('heading', { name: '셔틀', level: 3 });
    await user.click(screen.getByRole('button', { name: '새로고침' }));

    expect(callsTo(fetchMock, 'GET', '/api/admin/scrapers')).toHaveLength(2);
  });

  describe('폴링', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    });

    it('진행 중인 수집이 있으면 3초마다 다시 불러온다', async () => {
      const fetchMock = routeFetch({
        'GET /api/admin/scrapers': () =>
          ok(allStatuses({ shuttle: makeStatus('shuttle', makeRun({ status: 'running', finishedAt: null })) })),
        'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      });
      renderApp('/scrapers', { apiKey: 'k' });
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(callsTo(fetchMock, 'GET', '/api/admin/scrapers')).toHaveLength(1);

      await act(() => vi.advanceTimersByTimeAsync(3000));
      expect(callsTo(fetchMock, 'GET', '/api/admin/scrapers')).toHaveLength(2);
    });

    it('진행 중인 수집이 없으면 30초마다 다시 불러온다', async () => {
      const fetchMock = routeFetch({
        'GET /api/admin/scrapers': () => ok(allStatuses()),
        'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      });
      renderApp('/scrapers', { apiKey: 'k' });
      await act(() => vi.advanceTimersByTimeAsync(0));

      await act(() => vi.advanceTimersByTimeAsync(3000));
      expect(callsTo(fetchMock, 'GET', '/api/admin/scrapers')).toHaveLength(1);
      await act(() => vi.advanceTimersByTimeAsync(27_000));
      expect(callsTo(fetchMock, 'GET', '/api/admin/scrapers')).toHaveLength(2);
    });

    it('폴링 중 키가 거절되면(403) 로그아웃하고 로그인 화면으로 간다', async () => {
      let revoked = false;
      routeFetch({
        'GET /api/admin/scrapers': () =>
          revoked ? jsonResponse(403, { statusCode: 403, message: 'Forbidden resource' }) : ok(allStatuses()),
        'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      });
      renderApp('/scrapers', { apiKey: 'k' });
      await act(() => vi.advanceTimersByTimeAsync(0));

      revoked = true;
      await act(() => vi.advanceTimersByTimeAsync(30_000));

      expect(screen.getByRole('heading', { name: '운영자 확인이 필요해요' })).toBeInTheDocument();
      expect(sessionStorage.getItem('admin.apiKey')).toBeNull();
    });
  });

  it('대상별 수집 버튼은 타입과 대상을 함께 요청한다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrapers': () =>
        ok(
          allStatuses({
            cafeteria: makeStatus('cafeteria', makeRun({ type: 'cafeteria' }), null, [
              {
                target: '2',
                targetName: '교육문화식당',
                latestRun: makeRun({ type: 'cafeteria', target: '2' }),
                lastSucceededRun: null,
              },
            ]),
          }),
        ),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      'POST /api/admin/scrape-runs': () => ok({ runs: [makeRun({ status: 'pending' })] }, 202),
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await screen.findByRole('heading', { name: '학식', level: 3 });
    await user.click(within(card('학식')).getByRole('button', { name: '교육문화식당 수집' }));

    const posts = callsTo(fetchMock, 'POST', '/api/admin/scrape-runs');
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0][1].body as string)).toEqual({ type: 'cafeteria', target: '2' });
  });

  it('대상이 있는 카드의 전체 수집은 target 없이 요청한다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrapers': () =>
        ok(
          allStatuses({
            cafeteria: makeStatus('cafeteria', makeRun({ type: 'cafeteria' }), null, [
              {
                target: '2',
                targetName: '교육문화식당',
                latestRun: makeRun({ type: 'cafeteria', target: '2' }),
                lastSucceededRun: null,
              },
            ]),
          }),
        ),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      'POST /api/admin/scrape-runs': () => ok({ runs: [makeRun({ status: 'pending' })] }, 202),
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await screen.findByRole('heading', { name: '학식', level: 3 });
    await user.click(within(card('학식')).getByRole('button', { name: '전체 수집' }));

    const posts = callsTo(fetchMock, 'POST', '/api/admin/scrape-runs');
    expect(JSON.parse(posts[0][1].body as string)).toEqual({ type: 'cafeteria' });
  });

  it('타입 전체 최근 run이 성공이어도 실패한 대상이 있으면 맨 위 알림에 그 타입을 올린다', async () => {
    routeFetch({
      'GET /api/admin/scrapers': () =>
        ok(
          allStatuses({
            cafeteria: makeStatus('cafeteria', makeRun({ id: 99, type: 'cafeteria' }), null, [
              {
                target: '2',
                targetName: '교육문화식당',
                latestRun: makeRun({ id: 40, type: 'cafeteria', target: '2', status: 'failed' }),
                lastSucceededRun: null,
              },
            ]),
          }),
        ),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
    });
    renderApp('/scrapers', { apiKey: 'k' });

    expect(
      await screen.findByText('학식 수집이 실패했어요. 카드의 오류를 확인하고 다시 수집해 주세요.'),
    ).toBeInTheDocument();
  });
});
