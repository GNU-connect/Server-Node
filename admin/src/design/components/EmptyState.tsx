import type { ReactNode } from 'react';
import { cx } from '../cx';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  imageSrc?: string;
  action?: ReactNode;
  className?: string;
}

/** 보여줄 데이터가 없을 때. */
export function EmptyState({ title, description, imageSrc, action, className }: EmptyStateProps) {
  return (
    <div className={cx('jn-empty', className)}>
      {imageSrc && (
        <div className="jn-empty-art">
          <img src={imageSrc} alt="" />
        </div>
      )}
      <h3 className="jn-empty-title">{title}</h3>
      {description && <p className="jn-empty-desc">{description}</p>}
      {action}
    </div>
  );
}
