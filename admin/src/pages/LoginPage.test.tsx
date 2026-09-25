import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { allStatuses } from '../test/fixtures';
import { jsonResponse, ok, routeFetch } from '../test/http';
import { renderApp } from '../test/renderApp';

function adminRoutes(validKey = 'secret') {
  return routeFetch({
    'GET /api/admin/scrapers': (_url, init) => {
      const key = (init?.headers as Record<string, string>)['x-admin-api-key'];
      return key === validKey
        ? ok(allStatuses())
        : jsonResponse(403, { statusCode: 403, message: 'Forbidden resource' });
    },
    'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
  });
}

describe('로그인', () => {
  it('로그인하지 않았으면 어느 경로든 로그인 화면을 보여 준다', async () => {
    adminRoutes();
    renderApp('/scrapers');

    expect(await screen.findByRole('heading', { name: '운영자 확인이 필요해요' })).toBeInTheDocument();
  });

  it('키를 비워 두면 들어가기 버튼이 눌리지 않는다', async () => {
    adminRoutes();
    renderApp('/login');

    expect(await screen.findByRole('button', { name: '들어가기' })).toBeDisabled();
  });

  it('맞는 키를 넣으면 키를 저장하고 수집 상태 화면으로 간다', async () => {
    const fetchMock = adminRoutes();
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('어드민 API 키'), 'secret');
    await user.click(screen.getByRole('button', { name: '들어가기' }));

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
    expect(sessionStorage.getItem('admin.apiKey')).toBe('secret');
    expect(fetchMock.mock.calls[0][1].headers['x-admin-api-key']).toBe('secret');
  });

  it('앞뒤 공백은 지우고 확인한다', async () => {
    adminRoutes();
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('어드민 API 키'), '  secret ');
    await user.click(screen.getByRole('button', { name: '들어가기' }));

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
    expect(sessionStorage.getItem('admin.apiKey')).toBe('secret');
  });

  it('틀린 키면 안내하고 저장하지 않는다', async () => {
    adminRoutes();
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('어드민 API 키'), 'wrong');
    await user.click(screen.getByRole('button', { name: '들어가기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('키가 맞지 않아요. 다시 확인해 주세요.');
    expect(sessionStorage.getItem('admin.apiKey')).toBeNull();
    expect(screen.getByRole('button', { name: '들어가기' })).toBeEnabled();
  });

  it('서버에 닿지 못하면 연결 안내를 보여 준다', async () => {
    routeFetch({}).mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(screen.getByLabelText('어드민 API 키'), 'secret');
    await user.click(screen.getByRole('button', { name: '들어가기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결하지 못했어요.');
  });

  it('로그인 후에는 원래 가려던 화면으로 돌아간다', async () => {
    adminRoutes();
    const user = userEvent.setup();
    renderApp('/scrape-runs');

    await user.type(await screen.findByLabelText('어드민 API 키'), 'secret');
    await user.click(screen.getByRole('button', { name: '들어가기' }));

    expect(await screen.findByRole('heading', { name: '실행 기록', level: 1 })).toBeInTheDocument();
  });

  it('키 보기 버튼으로 입력값을 보이거나 숨긴다', async () => {
    adminRoutes();
    const user = userEvent.setup();
    renderApp('/login');
    const input = screen.getByLabelText('어드민 API 키');

    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: '키 보기' }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: '키 숨기기' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('이미 로그인했으면 로그인 화면 대신 수집 상태로 보낸다', async () => {
    adminRoutes();
    renderApp('/login', { apiKey: 'secret' });

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
  });
});
