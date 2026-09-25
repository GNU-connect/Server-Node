import type { IconName } from '../design/components';

export interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

export interface NavGroup {
  label: string;
  icon: IconName;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '수집 관리',
    icon: 'activity',
    items: [
      { path: '/scrapers', label: '수집 상태', icon: 'refresh' },
      { path: '/scrape-runs', label: '실행 기록', icon: 'list' },
    ],
  },
];

export function findNav(pathname: string): { group: NavGroup; item: NavItem } | null {
  for (const group of NAV_GROUPS) {
    const item = group.items.find(candidate => candidate.path === pathname);
    if (item) return { group, item };
  }
  return null;
}
