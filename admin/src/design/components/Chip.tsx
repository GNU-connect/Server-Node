import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from './Icon';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: IconName;
}

/** 여러 개 중 하나를 누르는 둥근 칩. */
export function Chip({ selected = false, icon, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button type={type} {...rest} className={cx('jn-chip', className)} aria-pressed={selected}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
