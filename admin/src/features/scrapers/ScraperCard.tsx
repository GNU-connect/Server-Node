import { Link } from 'react-router-dom';
import type { ScrapeRun, ScrapeRunType, ScraperStatus, ScraperTargetStatus } from '../../api/types';
import { Badge, Button, Card, Icon, Notice } from '../../design/components';
import { formatDateTime, formatDuration } from './format';
import {
  NO_RUN_VIEW,
  STATUS_VIEWS,
  TRIGGER_LABELS,
  TYPE_ICONS,
  TYPE_LABELS,
  failedTargets,
  isInProgress,
  overallView,
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
  const view = overallView(status);
  const hasTargets = targets.length > 0;
  const failed = failedTargets(status);
  // 대상이 있으면 모든 대상이 진행 중일 때만 전체 수집을 막는다
  const inProgress = hasTargets
    ? targets.every(item => isInProgress(item.latestRun))
    : isInProgress(latestRun);
  const lastSuccessAt = hasTargets ? oldestLastSuccess(targets) : succeededAt(lastSucceededRun);
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

      {!hasTargets && latestRun?.status === 'failed' && (
        <Notice tone="danger" title="수집 실패">
          <p className="ad-clamp-3">{latestRun.errorMessage || '오류 메시지가 없어요.'}</p>
          <Link className="ad-link" to={`/scrape-runs?type=${type}&run=${latestRun.id}`}>
            실행 기록에서 전체 보기
          </Link>
        </Notice>
      )}

      {hasTargets && failed.length > 0 && (
        <Notice tone="danger" title={`${failed.length}곳 수집 실패`}>
          <ul>
            {failed.map(item => (
              <li key={item.target}>
                <strong>{item.targetName}</strong>
                <p className="ad-clamp-3">{item.latestRun?.errorMessage || '오류 메시지가 없어요.'}</p>
              </li>
            ))}
          </ul>
          <Link
            className="ad-link"
            to={`/scrape-runs?type=${type}&target=${failed[0].target}&run=${failed[0].latestRun?.id}`}
          >
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

function succeededAt(run: ScrapeRun | null): string | undefined {
  return run ? (run.finishedAt ?? run.createdAt) : undefined;
}

/** 모든 대상이 이 시각 이후로 성공했다는 뜻으로, 대상별 마지막 성공 중 가장 오래된 시각. 성공 기록이 없는 대상이 있으면 없음. */
function oldestLastSuccess(targets: ScraperTargetStatus[]): string | undefined {
  const times = targets.map(item => succeededAt(item.lastSucceededRun));
  if (times.some(time => time === undefined)) return undefined;
  return (times as string[]).reduce((oldest, time) => (time < oldest ? time : oldest));
}
