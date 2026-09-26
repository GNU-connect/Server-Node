import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cx } from '../design/cx';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const SIDEBAR_COLLAPSED_KEY = 'admin.sidebarCollapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // 기억하지 못해도 이번 화면에서는 동작한다
  }
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  function toggle() {
    const next = !collapsed;
    writeCollapsed(next);
    setCollapsed(next);
  }

  return (
    <div className={cx('ad-shell', collapsed && 'is-collapsed')}>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="ad-main">
        <Topbar />
        <main className="ad-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
