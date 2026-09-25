import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'neutral' | 'blue' | 'sky' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: IconName;
  children?: ReactNode;
  className?: string;
}

/** 상태·분류 표시. 누를 수 없음. 상태색은 항상 단어와 함께 쓴다. */
export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span className={cx('jn-badge', tone !== 'neutral' && `jn-badge-${tone}`, className)}>
      {icon && <Icon name={icon} size={14} strokeWidth={2.4} />}
      {children}
    </span>
  );
}
