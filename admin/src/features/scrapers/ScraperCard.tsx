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
} from './labels';

interface ScraperCardProps {
  status: ScraperStatus;
  now: Date;
  requesting: boolean;
  /** 카드 안에 띄울 안내(409 등) */
  notice: string | null;
  onRequest(type: ScrapeRunType): void;
}

export function ScraperCard({ status, now, requesting, notice, onRequest }: ScraperCardProps) {
  const { type, latestRun, lastSucceededRun } = status;
  const view = latestRun ? STATUS_VIEWS[latestRun.status] : NO_RUN_VIEW;
  const inProgress = isInProgress(latestRun);
  const lastSuccessAt = lastSucceededRun?.finishedAt ?? lastSucceededRun?.createdAt;

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
        icon={inProgress || requesting ? undefined : 'refresh'}
        disabled={inProgress || requesting}
        onClick={() => onRequest(type)}
      >
        {requesting ? '요청하는 중…' : inProgress ? '수집 중…' : '지금 수집'}
      </Button>
    </Card>
  );
}
