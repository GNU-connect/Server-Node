import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, Icon } from '../design/components';
import { findNav } from './nav';

export function Topbar() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const current = findNav(pathname);

  return (
    <header className="ad-topbar">
      <nav className="ad-breadcrumb" aria-label="현재 위치">
        {current && (
          <>
            <span>{current.group.label}</span>
            <Icon name="chevron-right" size={16} />
            <span aria-current="page">{current.item.label}</span>
          </>
        )}
      </nav>
      <Button variant="ghost" size="sm" icon="logout" onClick={logout}>
        로그아웃
      </Button>
    </header>
  );
}
