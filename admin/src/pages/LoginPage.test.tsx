import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { allStatuses } from '../test/fixtures';
import { callsTo, jsonResponse, ok, routeFetch } from '../test/http';
import { renderApp } from '../test/renderApp';

const EMAIL = 'admin@example.com';
const PASSWORD = 'pw-123456';

function adminRoutes() {
  return routeFetch({
    'POST /api/admin/auth/login': (_url, init) => {
      const body = JSON.parse(String(init?.body));
      return body.email === EMAIL && body.password === PASSWORD
        ? ok({ email: body.email })
        : jsonResponse(401, { statusCode: 401, message: '이메일 또는 비밀번호가 맞지 않아요.' });
    },
    'GET /api/admin/scrapers': () => ok(allStatuses()),
    'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
  });
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('이메일'), email);
  await user.type(screen.getByLabelText('비밀번호'), password);
  await user.click(screen.getByRole('button', { name: '들어가기' }));
}

describe('로그인', () => {
  it('로그인하지 않았으면 어느 경로든 로그인 화면을 보여 준다', async () => {
    adminRoutes();
    renderApp('/scrapers');

    expect(await screen.findByRole('heading', { name: '운영자 확인이 필요해요' })).toBeInTheDocument();
  });

  it('이메일이나 비밀번호를 비워 두면 들어가기 버튼이 눌리지 않는다', async () => {
    adminRoutes();
    const user = userEvent.setup();
    renderApp('/login');

    expect(await screen.findByRole('button', { name: '들어가기' })).toBeDisabled();
    await user.type(screen.getByLabelText('이메일'), EMAIL);
    expect(screen.getByRole('button', { name: '들어가기' })).toBeDisabled();
    await user.type(screen.getByLabelText('비밀번호'), PASSWORD);
    expect(screen.getByRole('button', { name: '들어가기' })).toBeEnabled();
  });

  it('맞는 계정이면 수집 상태 화면으로 가고, 키 헤더 없이 JSON 본문으로 보낸다', async () => {
    const fetchMock = adminRoutes();
    renderApp('/login');

    await fillAndSubmit(EMAIL, PASSWORD);

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST', '/api/admin/auth/login');
    expect(JSON.parse(String(init.body))).toEqual({ email: EMAIL, password: PASSWORD });
  });

  it('이메일 앞뒤 공백은 지우고 보낸다', async () => {
    const fetchMock = adminRoutes();
    renderApp('/login');

    await fillAndSubmit(`  ${EMAIL} `, PASSWORD);

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST', '/api/admin/auth/login');
    expect(JSON.parse(String(init.body)).email).toBe(EMAIL);
  });

  it('틀린 계정이면 서버가 준 문구를 보여 주고 다시 시도할 수 있다', async () => {
    adminRoutes();
    renderApp('/login');

    await fillAndSubmit(EMAIL, 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 맞지 않아요.');
    expect(screen.getByRole('button', { name: '들어가기' })).toBeEnabled();
  });

  it('잠긴 계정이면 429 문구를 그대로 보여 준다', async () => {
    routeFetch({
      'POST /api/admin/auth/login': () =>
        jsonResponse(429, {
          statusCode: 429,
          message: '로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요.',
        }),
    });
    renderApp('/login');

    await fillAndSubmit(EMAIL, PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent('15분 뒤에 다시 시도해 주세요.');
  });

  it('서버에 닿지 못하면 연결 안내를 보여 준다', async () => {
    routeFetch({}).mockRejectedValue(new TypeError('Failed to fetch'));
    renderApp('/login');

    await fillAndSubmit(EMAIL, PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결하지 못했어요.');
  });

  it('로그인 후에는 원래 가려던 화면으로 돌아간다', async () => {
    adminRoutes();
    renderApp('/scrape-runs');

    await fillAndSubmit(EMAIL, PASSWORD);

    expect(await screen.findByRole('heading', { name: '실행 기록', level: 1 })).toBeInTheDocument();
  });

  it('비밀번호 보기 버튼으로 입력값을 보이거나 숨긴다', async () => {
    adminRoutes();
    const user = userEvent.setup();
    renderApp('/login');
    const input = await screen.findByLabelText('비밀번호');

    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: '비밀번호 숨기기' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('이미 로그인했으면 로그인 화면 대신 수집 상태로 보낸다', async () => {
    adminRoutes();
    renderApp('/login', { loggedIn: true });

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
  });

  it('로그인 상태 확인이 네트워크 오류로 실패해도 로그인 화면을 보여 준다', async () => {
    adminRoutes();
    renderApp('/scrapers', { meFails: true });

    expect(await screen.findByRole('heading', { name: '운영자 확인이 필요해요' })).toBeInTheDocument();
  });
});
