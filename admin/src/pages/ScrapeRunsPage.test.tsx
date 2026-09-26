import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ScrapeRun } from '../api/types';
import { makeRun } from '../test/fixtures';
import { callsTo, jsonResponse, ok, routeFetch } from '../test/http';
import { renderApp } from '../test/renderApp';

const RUN_12 = makeRun({ id: 12, type: 'cafeteria', status: 'failed', errorMessage: 'line 1\nline 2' });
const RUN_11 = makeRun({ id: 11 });
const RUN_5 = makeRun({ id: 5, type: 'university-notice' });

function listUrls(fetchMock: ReturnType<typeof routeFetch>) {
  return callsTo(fetchMock, 'GET', '/api/admin/scrape-runs?').map(([url]) => url);
}

function table() {
  return screen.getByRole('table', { name: '실행 기록' });
}

describe('실행 기록 화면', () => {
  it('실행 기록을 20건씩 불러와 표로 보여 준다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrape-runs': () => ok({ items: [RUN_12, RUN_11], nextCursor: null }),
    });
    renderApp('/scrape-runs', { apiKey: 'k' });

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(within(table()).getAllByRole('row')).toHaveLength(3);
    expect(listUrls(fetchMock)).toEqual(['/api/admin/scrape-runs?limit=20']);
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('타입·상태 칩을 누르면 조건을 걸어 처음부터 다시 불러온다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrape-runs': () => ok({ items: [RUN_12], nextCursor: null }),
    });
    const user = userEvent.setup();
    renderApp('/scrape-runs', { apiKey: 'k' });
    await screen.findByText('12');

    await user.click(within(screen.getByRole('group', { name: '타입' })).getByRole('button', { name: '학식' }));
    await user.click(within(screen.getByRole('group', { name: '상태' })).getByRole('button', { name: '실패' }));

    expect(await screen.findByRole('button', { name: '실패', pressed: true })).toBeInTheDocument();
    expect(listUrls(fetchMock).at(-1)).toBe('/api/admin/scrape-runs?type=cafeteria&status=failed&limit=20');
  });

  it('더 보기는 nextCursor로 이어서 불러와 아래에 붙인다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrape-runs': url =>
        url.searchParams.get('cursor') === '11'
          ? ok({ items: [RUN_5], nextCursor: null })
          : ok({ items: [RUN_12, RUN_11], nextCursor: 11 }),
    });
    const user = userEvent.setup();
    renderApp('/scrape-runs', { apiKey: 'k' });
    await screen.findByText('12');

    await user.click(screen.getByRole('button', { name: '더 보기' }));

    expect(await screen.findByText('5')).toBeInTheDocument();
    expect(within(table()).getAllByRole('row')).toHaveLength(4);
    expect(listUrls(fetchMock).at(-1)).toBe('/api/admin/scrape-runs?cursor=11&limit=20');
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('더 보기 응답이 필터를 바꾼 뒤에 오면 버린다', async () => {
    let releaseMore!: () => void;
    routeFetch({
      'GET /api/admin/scrape-runs': url => {
        if (url.searchParams.get('cursor') === '11') {
          return new Promise<Response>(resolve => {
            releaseMore = () => resolve(ok({ items: [RUN_5], nextCursor: null }));
          });
        }
        if (url.searchParams.get('type') === 'cafeteria') return ok({ items: [RUN_12], nextCursor: null });
        return ok({ items: [RUN_12, RUN_11], nextCursor: 11 });
      },
    });
    const user = userEvent.setup();
    renderApp('/scrape-runs', { apiKey: 'k' });
    await screen.findByText('11');

    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await user.click(within(screen.getByRole('group', { name: '타입' })).getByRole('button', { name: '학식' }));
    await screen.findByRole('button', { name: '학식', pressed: true });
    await act(async () => releaseMore());

    expect(within(table()).getAllByRole('row')).toHaveLength(2);
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('주소의 잘못된 필터·run 값은 무시한다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrape-runs': () => ok({ items: [RUN_11], nextCursor: null }),
    });
    renderApp('/scrape-runs?type=foo&status=done&run=abc', { apiKey: 'k' });

    await screen.findByText('11');
    expect(listUrls(fetchMock)).toEqual(['/api/admin/scrape-runs?limit=20']);
    expect(screen.queryByRole('complementary', { name: /실행 #/ })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: '타입' })).getByRole('button', { name: '전체' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('행을 누르면 상세 패널에 오류 전문을 보여 주고, Esc로 닫는다', async () => {
    routeFetch({
      'GET /api/admin/scrape-runs': () => ok({ items: [RUN_12, RUN_11], nextCursor: null }),
      'GET /api/admin/scrape-runs/12': () => ok(RUN_12),
    });
    const user = userEvent.setup();
    renderApp('/scrape-runs', { apiKey: 'k' });

    await user.click(await screen.findByText('12'));

    const panel = await screen.findByRole('complementary', { name: '실행 #12' });
    expect(within(panel).getByText(/line 1\s+line 2/)).toHaveClass('ad-pre');
    expect(within(panel).getByText('자동')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('complementary', { name: '실행 #12' })).not.toBeInTheDocument();
  });

  it('주소에 run이 있으면 상세 패널을 바로 연다', async () => {
    routeFetch({
      'GET /api/admin/scrape-runs': () => ok({ items: [RUN_12], nextCursor: null }),
      'GET /api/admin/scrape-runs/12': () => ok(RUN_12),
    });
    renderApp('/scrape-runs?type=cafeteria&run=12', { apiKey: 'k' });

    expect(await screen.findByRole('complementary', { name: '실행 #12' })).toBeInTheDocument();
  });

  it('없는 run이면 패널에 안내하고 다시 부르지 않는다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      'GET /api/admin/scrape-runs/999': () =>
        jsonResponse(404, { statusCode: 404, message: '999번 수집 실행 기록을 찾을 수 없습니다.' }),
    });
    renderApp('/scrape-runs?run=999', { apiKey: 'k' });

    const panel = await screen.findByRole('complementary', { name: '실행 #999' });
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      '이 실행 기록을 찾지 못했어요. 번호를 확인해 주세요.',
    );
    expect(callsTo(fetchMock, 'GET', '/api/admin/scrape-runs/999')).toHaveLength(1);
  });

  it('상세를 불러오지 못하면 안내하고, 다시 시도로 다시 불러온다', async () => {
    let fail = true;
    routeFetch({
      'GET /api/admin/scrape-runs': () => ok({ items: [RUN_12], nextCursor: null }),
      'GET /api/admin/scrape-runs/12': () =>
        fail ? new Response('Internal Server Error', { status: 500 }) : ok(RUN_12),
    });
    const user = userEvent.setup();
    renderApp('/scrape-runs?run=12', { apiKey: 'k' });

    const panel = await screen.findByRole('complementary', { name: '실행 #12' });
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      '요청이 실패했어요(HTTP 500). 잠시 뒤 다시 시도해 주세요.',
    );
    fail = false;
    await user.click(within(panel).getByRole('button', { name: '다시 시도' }));

    expect(await within(panel).findByText('자동')).toBeInTheDocument();
    expect(within(panel).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('필터를 바꾼 요청이 실패하면 이전 목록과 더 보기를 남기지 않는다', async () => {
    routeFetch({
      'GET /api/admin/scrape-runs': url =>
        url.searchParams.get('status') === 'failed'
          ? new Response('Internal Server Error', { status: 500 })
          : ok({ items: [RUN_12, RUN_11], nextCursor: 11 }),
    });
    const user = userEvent.setup();
    renderApp('/scrape-runs', { apiKey: 'k' });
    await screen.findByText('11');

    await user.click(within(screen.getByRole('group', { name: '상태' })).getByRole('button', { name: '실패' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('요청이 실패했어요(HTTP 500).');
    expect(screen.queryByText('11')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('조건에 맞는 기록이 없으면 필터 초기화를 제안한다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrape-runs': url =>
        url.searchParams.get('status') === 'failed'
          ? ok({ items: [], nextCursor: null })
          : ok({ items: [RUN_11], nextCursor: null }),
    });
    const user = userEvent.setup();
    renderApp('/scrape-runs?status=failed', { apiKey: 'k' });

    expect(await screen.findByRole('heading', { name: '조건에 맞는 실행 기록이 없어요' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '필터 초기화' }));

    expect(await screen.findByText('11')).toBeInTheDocument();
    expect(listUrls(fetchMock).at(-1)).toBe('/api/admin/scrape-runs?limit=20');
  });

  it('불러오기가 401이면 로그인 화면으로 간다', async () => {
    routeFetch({
      'GET /api/admin/scrape-runs': () => jsonResponse(401, { statusCode: 401, message: 'Unauthorized' }),
    });
    renderApp('/scrape-runs', { apiKey: 'k' });

    expect(await screen.findByRole('heading', { name: '운영자 확인이 필요해요' })).toBeInTheDocument();
  });

  describe('진행 중인 실행', () => {
    it('상세 패널이 3초마다 새로 불러와 끝나면 멈춘다', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
      let current: ScrapeRun = makeRun({ id: 30, status: 'running', finishedAt: null });
      const fetchMock = routeFetch({
        'GET /api/admin/scrape-runs': () => ok({ items: [current], nextCursor: null }),
        'GET /api/admin/scrape-runs/30': () => ok(current),
      });
      renderApp('/scrape-runs?run=30', { apiKey: 'k' });
      await act(() => vi.advanceTimersByTimeAsync(0));
      const detailCalls = () => callsTo(fetchMock, 'GET', '/api/admin/scrape-runs/30').length;
      expect(detailCalls()).toBe(1);

      current = makeRun({ id: 30, status: 'succeeded' });
      await act(() => vi.advanceTimersByTimeAsync(3000));
      expect(detailCalls()).toBe(2);
      expect(within(screen.getByRole('complementary', { name: '실행 #30' })).getByText('성공')).toBeInTheDocument();

      await act(() => vi.advanceTimersByTimeAsync(9000));
      expect(detailCalls()).toBe(2);
    });
  });
});
