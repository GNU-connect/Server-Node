import { createElement } from 'react';
import { cx } from '../cx';

type IconPart = ['path' | 'rect' | 'circle', Record<string, string | number>];

// 24px 격자, 2px 둥근 선. 디자인 시스템 Icon 16종 + 어드민용 7종.
const ICONS = {
  'chevron-down': [['path', { d: 'M6 9l6 6 6-6' }]],
  'chevron-up': [['path', { d: 'M6 15l6-6 6 6' }]],
  'chevron-left': [['path', { d: 'M15 6l-6 6 6 6' }]],
  'chevron-right': [['path', { d: 'M9 6l6 6-6 6' }]],
  check: [['path', { d: 'M5 12.5l4.5 4.5L19 7.5' }]],
  x: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
  meal: [
    ['path', { d: 'M6 3v6a2.5 2.5 0 0 0 5 0V3' }],
    ['path', { d: 'M8.5 3v18' }],
    ['path', { d: 'M17 21V3c-2 1.2-3 3.5-3 6.5 0 2 1 3.5 3 3.5' }],
  ],
  bus: [
    ['rect', { x: 4, y: 3, width: 16, height: 15, rx: 4 }],
    ['path', { d: 'M4 11h16' }],
    ['path', { d: 'M8 18v3M16 18v3' }],
    ['path', { d: 'M8 14.5h.01M16 14.5h.01' }],
  ],
  chat: [['path', { d: 'M4 7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-5l-5 4v-4.3A4 4 0 0 1 4 13z' }]],
  book: [
    ['path', { d: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z' }],
    ['path', { d: 'M4 20.5A2.5 2.5 0 0 0 6.5 21H20' }],
  ],
  calendar: [
    ['rect', { x: 3, y: 5, width: 18, height: 16, rx: 4 }],
    ['path', { d: 'M3 10h18M8 3v4M16 3v4' }],
  ],
  clock: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['path', { d: 'M12 7v5l3 2' }],
  ],
  pin: [
    ['path', { d: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z' }],
    ['circle', { cx: 12, cy: 10, r: 2.5 }],
  ],
  bell: [['path', { d: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z' }], ['path', { d: 'M10 21h4' }]],
  user: [
    ['circle', { cx: 12, cy: 8, r: 4 }],
    ['path', { d: 'M4 21a8 8 0 0 1 16 0' }],
  ],
  info: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['path', { d: 'M12 11v5M12 8h.01' }],
  ],
  alert: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['path', { d: 'M12 7v6M12 16.5h.01' }],
  ],
  refresh: [['path', { d: 'M20 12a8 8 0 1 1-2.3-5.7' }], ['path', { d: 'M20 4v5h-5' }]],
  logout: [
    ['path', { d: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3' }],
    ['path', { d: 'M10 17l-5-5 5-5' }],
    ['path', { d: 'M5 12h11' }],
  ],
  eye: [
    ['path', { d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' }],
    ['circle', { cx: 12, cy: 12, r: 3 }],
  ],
  'eye-off': [
    ['path', { d: 'M3 3l18 18' }],
    ['path', { d: 'M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1' }],
    ['path', { d: 'M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a10.4 10.4 0 0 0 5.4-1.6' }],
    ['path', { d: 'M9.9 9.9a3 3 0 0 0 4.2 4.2' }],
  ],
  list: [['path', { d: 'M9 6h11M9 12h11M9 18h11' }], ['path', { d: 'M4 6h.01M4 12h.01M4 18h.01' }]],
  activity: [['path', { d: 'M3 12h4l3 8 4-16 3 8h4' }]],
} satisfies Record<string, IconPart[]>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function Icon({ name, size = 20, strokeWidth = 2, label, className }: IconProps) {
  const parts: IconPart[] = ICONS[name];
  return (
    <svg
      className={cx('jn-icon', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {parts.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}
