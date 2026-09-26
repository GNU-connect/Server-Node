import { Link } from 'react-router-dom';
import type { ScrapeRunType, ScraperStatus } from '../../api/types';
import { Badge, Button, Card, Icon, Notice } from '../../design/components';
import { formatDateTime, formatDuration } from './format';
import {
  NO_RUN_VIEW,
  STATUS_VIEWS,
  TRIGGER_LABELS,
  TYPE_ICONS,
  TYPE_LABELS,
  isInProgress,
  summarizeTargets,
} from './labels';

interface ScraperCardProps {
  status: ScraperStatus;
  now: Date;
  /** 타입 전체(또는 대상 없는 타입) 요청을 보내는 중인지 */
  requesting: boolean;
  /** 대상 하나의 요청을 보내는 중이면 그 대상 */
  requestingTarget?: string | null;
  /** 카드 안에 띄울 안내(409 등) */
  notice: string | null;
  onRequest(type: ScrapeRunType, target?: string): void;
}

export function ScraperCard({
  status,
  now,
  requesting,
  requestingTarget = null,
  notice,
  onRequest,
}: ScraperCardProps) {
  const { type, latestRun, lastSucceededRun, targets } = status;
  const view = latestRun ? STATUS_VIEWS[latestRun.status] : NO_RUN_VIEW;
  const hasTargets = targets.length > 0;
  // 대상이 있으면 모든 대상이 진행 중일 때만 전체 수집을 막는다
  const inProgress = hasTargets
    ? targets.every(item => isInProgress(item.latestRun))
    : isInProgress(latestRun);
  const lastSuccessAt = lastSucceededRun?.finishedAt ?? lastSucceededRun?.createdAt;
  const requestingAny = requesting || requestingTarget !== null;

  return (
    <Card
      className="ad-scraper-card"
      eyebrow={
        <span className="ad-card-icon">
          <Icon name={TYPE_ICONS[type]} />
        </span>
      }
      title={TYPE_LABELS[type]}
      action={
        <Badge tone={view.tone} icon={view.icon}>
          {view.label}
        </Badge>
      }
    >
      <dl className="ad-info">
        <dt>최근 실행</dt>
        <dd>
          {latestRun
            ? `${formatDateTime(latestRun.createdAt, now)} · ${TRIGGER_LABELS[latestRun.trigger]}`
            : '-'}
        </dd>
        <dt>소요</dt>
        <dd>{latestRun ? formatDuration(latestRun.startedAt, latestRun.finishedAt) : '-'}</dd>
        <dt>마지막 성공</dt>
        <dd>{lastSuccessAt ? formatDateTime(lastSuccessAt, now) : '아직 없어요'}</dd>
      </dl>

      {hasTargets && (
        <details className="ad-target-list">
          <summary>{summarizeTargets(targets)}</summary>
          <ul>
            {targets.map(item => {
              const itemView = item.latestRun ? STATUS_VIEWS[item.latestRun.status] : NO_RUN_VIEW;
              const itemBusy =
                isInProgress(item.latestRun) || requesting || requestingTarget === item.target;
              return (
                <li key={item.target} className="ad-target-row">
                  <Link className="ad-link" to={`/scrape-runs?type=${type}&target=${item.target}`}>
                    {item.targetName}
                  </Link>
                  <Badge tone={itemView.tone} icon={itemView.icon}>
                    {itemView.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={itemBusy}
                    aria-label={`${item.targetName} 수집`}
                    onClick={() => onRequest(type, item.target)}
                  >
                    수집
                  </Button>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {latestRun?.status === 'failed' && (
        <Notice tone="danger" title="수집 실패">
          <p className="ad-clamp-3">{latestRun.errorMessage || '오류 메시지가 없어요.'}</p>
          <Link className="ad-link" to={`/scrape-runs?type=${type}&run=${latestRun.id}`}>
            실행 기록에서 전체 보기
          </Link>
        </Notice>
      )}

      {notice && <Notice>{notice}</Notice>}

      <Button
        variant="soft"
        block
        icon={inProgress || requestingAny ? undefined : 'refresh'}
        disabled={inProgress || requestingAny}
        onClick={() => onRequest(type)}
      >
        {requestingAny
          ? '요청하는 중…'
          : inProgress
            ? '수집 중…'
            : hasTargets
              ? '전체 수집'
              : '지금 수집'}
      </Button>
    </Card>
  );
}
