import { useId, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

export interface SectionProps {
  title: string;
  actions?: ReactNode;
  footer?: ReactNode;
  collapsible?: boolean;
  children: ReactNode;
}

/** 흰 판 위 제목 + 본문. 오른쪽 위 "접기"로 본문을 숨길 수 있다. */
export function Section({ title, actions, footer, collapsible = true, children }: SectionProps) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();

  return (
    <section className="ad-section" aria-label={title}>
      <div className="ad-section-head">
        <h2 className="ad-section-title">{title}</h2>
        <div className="ad-page-actions">
          {actions}
          {collapsible && (
            <button
              type="button"
              className="ad-section-toggle"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => setOpen(o => !o)}
            >
              {open ? '접기' : '펼치기'}
              <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div id={bodyId}>
          <div className="ad-section-body">{children}</div>
          {footer && <div className="ad-section-foot">{footer}</div>}
        </div>
      )}
    </section>
  );
}
