import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../design/components';
import { cx } from '../design/cx';
import { NAV_GROUPS } from './nav';

interface SidebarProps {
  collapsed: boolean;
  onToggle(): void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});

  return (
    <aside className={cx('ad-sidebar', collapsed && 'is-collapsed')}>
      <div className="ad-brand">
        <img className="ad-brand-icon" src="/jinu-app-icon.webp" alt="" />
        {!collapsed && <span className="ad-brand-name">커넥트 지누 어드민</span>}
        <button
          type="button"
          className="ad-icon-btn"
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          onClick={onToggle}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
        </button>
      </div>
      <nav aria-label="주요 메뉴">
        {NAV_GROUPS.map(group => {
          // 사이드바를 접으면 그룹 머리 없이 아이콘 메뉴만 보인다
          const open = collapsed || !closedGroups[group.label];
          return (
            <div key={group.label} className="ad-nav-group">
              {!collapsed && (
                <button
                  type="button"
                  className="ad-nav-group-head"
                  aria-expanded={open}
                  onClick={() => setClosedGroups(prev => ({ ...prev, [group.label]: open }))}
                >
                  <Icon name={group.icon} />
                  <span>{group.label}</span>
                  <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
                </button>
              )}
              {open && (
                <ul className="ad-nav-items">
                  {group.items.map(item => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => cx('ad-nav-item', isActive && 'is-active')}
                        aria-label={collapsed ? item.label : undefined}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon name={item.icon} />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
