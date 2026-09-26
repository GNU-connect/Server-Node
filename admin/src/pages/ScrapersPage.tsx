import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getScraperStatuses, listScrapeRuns, requestScrapeRun } from '../api/adminClient';
import { ConflictError, UnauthorizedError, errorText } from '../api/errors';
import {
  SCRAPE_RUN_TYPES,
  type ScrapeRun,
  type ScrapeRunType,
  type ScraperStatus,
} from '../api/types';
import { useApiKey, useAuth } from '../auth/AuthContext';
import { Button, EmptyState, Notice, Section } from '../design/components';
import { RunTable } from '../features/scrapers/RunTable';
import { ScraperCard } from '../features/scrapers/ScraperCard';
import { formatElapsed } from '../features/scrapers/format';
import { TYPE_LABELS, isInProgress } from '../features/scrapers/labels';
import { useNow } from '../features/scrapers/useNow';
import { usePolling } from '../features/scrapers/usePolling';
import { PageHeader } from '../layout/PageHeader';

const ACTIVE_INTERVAL_MS = 3000;
const IDLE_INTERVAL_MS = 30_000;
const RECENT_LIMIT = 10;
const CONFLICT_NOTICE = '이미 수집이 대기 중이거나 실행 중이에요.';

/** 서버가 어떤 타입을 빼고 주더라도 카드 4장을 같은 순서로 보여 준다. */
function toCards(statuses: ScraperStatus[]): ScraperStatus[] {
  return SCRAPE_RUN_TYPES.map(
    type =>
      statuses.find(status => status.type === type) ?? {
        type,
        latestRun: null,
        lastSucceededRun: null,
        targets: [],
      },
  );
}

export function ScrapersPage() {
  const apiKey = useApiKey();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const now = useNow();

  const [statuses, setStatuses] = useState<ScraperStatus[] | null>(null);
  const [recent, setRecent] = useState<ScrapeRun[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<{ type: ScrapeRunType; target?: string } | null>(
    null,
  );
  const [notices, setNotices] = useState<Partial<Record<ScrapeRunType, string>>>({});
  // 연타 방지: state 반영 전 두 번째 클릭도 막는다
  const requestingRef = useRef(false);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof UnauthorizedError) {
        logout();
        return;
      }
      setLoadError(errorText(err));
    },
    [logout],
  );

  const load = useCallback(async () => {
    try {
      const [nextStatuses, page] = await Promise.all([
        getScraperStatuses(apiKey),
        listScrapeRuns(apiKey, { limit: RECENT_LIMIT }),
      ]);
      setStatuses(nextStatuses);
      setRecent(page.items);
      setUpdatedAt(new Date());
      setLoadError(null);
    } catch (err) {
      handleError(err);
    }
  }, [apiKey, handleError]);

  const cards = statuses ? toCards(statuses) : null;
  const active = cards?.some(card => isInProgress(card.latestRun)) ?? false;
  usePolling(load, active ? ACTIVE_INTERVAL_MS : IDLE_INTERVAL_MS);

  async function handleRequest(type: ScrapeRunType, target?: string) {
    if (requestingRef.current) return;
    requestingRef.current = true;
    setRequesting({ type, target });
    setNotices(prev => ({ ...prev, [type]: undefined }));
    try {
      await requestScrapeRun(apiKey, type, target);
      await load();
    } catch (err) {
      if (err instanceof ConflictError) setNotices(prev => ({ ...prev, [type]: CONFLICT_NOTICE }));
      else handleError(err);
    } finally {
      requestingRef.current = false;
      setRequesting(null);
    }
  }

  const failedLabels = (cards ?? [])
    .filter(card => card.latestRun?.status === 'failed')
    .map(card => TYPE_LABELS[card.type]);

  return (
    <div className="ad-page">
      <PageHeader
        title="수집 상태"
        actions={
          <>
            {updatedAt && <span className="ad-caption">{formatElapsed(updatedAt, now)} 갱신</span>}
            <Button variant="ghost" size="sm" icon="refresh" onClick={() => void load()}>
              새로고침
            </Button>
          </>
        }
      />

      {loadError && (
        <Notice tone="danger">
          {loadError}{' '}
          <Button variant="ghost" size="sm" onClick={() => void load()}>
            다시 시도
          </Button>
        </Notice>
      )}

      {failedLabels.length > 0 && (
        <Notice tone="danger">
          {failedLabels.join(', ')} 수집이 실패했어요. 카드의 오류를 확인하고 다시 수집해 주세요.
        </Notice>
      )}

      <div className="ad-card-grid" aria-busy={cards === null}>
        {cards
          ? cards.map(status => (
              <ScraperCard
                key={status.type}
                status={status}
                now={now}
                requesting={requesting?.type === status.type && requesting.target === undefined}
                requestingTarget={
                  requesting?.type === status.type ? (requesting.target ?? null) : null
                }
                notice={notices[status.type] ?? null}
                onRequest={handleRequest}
              />
            ))
          : SCRAPE_RUN_TYPES.map(type => <div key={type} className="ad-skeleton" aria-hidden />)}
      </div>

      <Section
        title="최근 실행"
        footer={
          <Link className="ad-link" to="/scrape-runs">
            실행 기록 전체 보기
          </Link>
        }
      >
        {recent.length > 0 ? (
          <RunTable
            runs={recent}
            now={now}
            caption="최근 실행"
            onSelect={run => navigate(`/scrape-runs?run=${run.id}`)}
          />
        ) : (
          statuses && <EmptyState title="아직 실행 기록이 없어요" />
        )}
      </Section>
    </div>
  );
}
