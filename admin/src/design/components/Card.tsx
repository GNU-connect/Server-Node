import type { ElementType, ReactNode } from 'react';
import { cx } from '../cx';

export interface CardProps {
  title?: ReactNode;
  meta?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  tone?: 'default' | 'cream' | 'sky';
  as?: ElementType;
  children?: ReactNode;
  className?: string;
}

/** 정보 묶음 하나. */
export function Card({
  title,
  meta,
  eyebrow,
  action,
  tone = 'default',
  as: Tag = 'section',
  children,
  className,
}: CardProps) {
  const hasHead = Boolean(title || meta || action);
  return (
    <Tag className={cx('jn-card', tone !== 'default' && `jn-card-${tone}`, className)}>
      {hasHead && (
        <div className="jn-card-head">
          <div className="jn-card-titles">
            {eyebrow}
            {title && <h3 className="jn-card-title">{title}</h3>}
            {meta && <p className="jn-card-meta">{meta}</p>}
          </div>
          {action}
        </div>
      )}
      {children && <div className="jn-card-body">{children}</div>}
    </Tag>
  );
}
