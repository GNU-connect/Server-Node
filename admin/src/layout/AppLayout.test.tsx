import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { allStatuses } from '../test/fixtures';
import { ok, routeFetch } from '../test/http';
import { renderApp } from '../test/renderApp';

beforeEach(() => {
  routeFetch({
    'GET /api/admin/scrapers': () => ok(allStatuses()),
    'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
  });
});

describe('어드민 셸', () => {
  it('/는 수집 상태로 보내고 사이드바와 브레드크럼을 보여 준다', async () => {
    renderApp('/', { apiKey: 'k' });

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
    const breadcrumb = screen.getByRole('navigation', { name: '현재 위치' });
    expect(breadcrumb).toHaveTextContent('수집 관리');
    expect(within(breadcrumb).getByText('수집 상태')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '수집 상태' })).toHaveClass('is-active');
  });

  it('사이드바 메뉴로 실행 기록 화면에 간다', async () => {
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await user.click(await screen.findByRole('link', { name: '실행 기록' }));

    expect(await screen.findByRole('heading', { name: '실행 기록', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '실행 기록' })).toHaveClass('is-active');
  });

  it('메뉴 그룹을 접으면 하위 메뉴가 사라진다', async () => {
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    const groupButton = await screen.findByRole('button', { name: '수집 관리' });
    expect(groupButton).toHaveAttribute('aria-expanded', 'true');
    await user.click(groupButton);

    expect(groupButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: '실행 기록' })).not.toBeInTheDocument();
  });

  it('사이드바를 접으면 아이콘 메뉴만 남고 상태를 기억한다', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp('/scrapers', { apiKey: 'k' });

    await user.click(await screen.findByRole('button', { name: '사이드바 접기' }));

    expect(screen.queryByText('커넥트 지누 어드민')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '실행 기록' })).toBeInTheDocument();
    expect(localStorage.getItem('admin.sidebarCollapsed')).toBe('1');

    unmount();
    renderApp('/scrapers', { apiKey: 'k' });
    expect(await screen.findByRole('button', { name: '사이드바 펼치기' })).toBeInTheDocument();
  });

  it('로그아웃하면 키를 지우고 로그인 화면으로 간다', async () => {
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await user.click(await screen.findByRole('button', { name: '로그아웃' }));

    expect(await screen.findByRole('heading', { name: '운영자 확인이 필요해요' })).toBeInTheDocument();
    expect(sessionStorage.getItem('admin.apiKey')).toBeNull();
  });
});
