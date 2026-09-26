import type { ReactNode } from 'react';

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="ad-page-head">
      <h1 className="ad-page-title">{title}</h1>
      {actions && <div className="ad-page-actions">{actions}</div>}
    </div>
  );
}
