import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from './Icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'soft' | 'ghost';
  size?: 'lg' | 'md' | 'sm';
  block?: boolean;
  icon?: IconName;
}

/** primary는 화면당 하나. soft는 보조, ghost는 텍스트 링크 대용. */
export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      className={cx(
        'jn-btn',
        `jn-btn-${variant}`,
        size !== 'md' && `jn-btn-${size}`,
        block && 'jn-btn-block',
        className,
      )}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} />}
      {children}
    </button>
  );
}
