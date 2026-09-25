import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Icon } from './Icon';

export interface NoticeProps {
  tone?: 'info' | 'danger';
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** 화면 안 안내·오류 상자. */
export function Notice({ tone = 'info', title, children, className }: NoticeProps) {
  return (
    <div
      className={cx('jn-notice', `jn-notice-${tone}`, className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon name={tone === 'danger' ? 'alert' : 'info'} size={20} />
      <div>
        {title && <strong className="jn-notice-title">{title}</strong>}
        {children}
      </div>
    </div>
  );
}
