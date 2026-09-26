import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listScrapeRuns } from '../api/adminClient';
import { UnauthorizedError, errorText } from '../api/errors';
import {
  SCRAPE_RUN_STATUSES,
  SCRAPE_RUN_TYPES,
  type ScrapeRun,
  type ScrapeRunStatus,
  type ScrapeRunType,
} from '../api/types';
import { useApiKey, useAuth } from '../auth/AuthContext';
import { Button, Chip, EmptyState, Notice, Section } from '../design/components';
import { cx } from '../design/cx';
import { RunDetailPanel } from '../features/scrapers/RunDetailPanel';
import { RunTable } from '../features/scrapers/RunTable';
import { STATUS_VIEWS, TYPE_LABELS } from '../features/scrapers/labels';
import { parseRunId, parseStatus, parseTarget, parseType } from '../features/scrapers/searchParams';
import { useNow } from '../features/scrapers/useNow';
import { PageHeader } from '../layout/PageHeader';

const PAGE_SIZE = 20;

export function ScrapeRunsPage() {
  const apiKey = useApiKey();
  const { logout } = useAuth();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const type = parseType(params.get('type'));
  const target = parseTarget(params.get('target'));
  const status = parseStatus(params.get('status'));
  const selectedId = parseRunId(params.get('run'));

  const [items, setItems] = useState<ScrapeRun[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  // 지금 보고 있는 필터. 늦게 도착한 "더 보기" 응답이 다른 필터 목록에 섞이지 않게 한다.
  const filterKey = `${type ?? ''}|${target ?? ''}|${status ?? ''}|${reloadToken}`;
  const filterKeyRef = useRef(filterKey);
  filterKeyRef.current = filterKey;

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof UnauthorizedError) logout();
      else setError(errorText(err));
    },
    [logout],
  );

  useEffect(() => {
    let cancelled = false;
    // 새 조건의 결과가 오기 전(또는 실패했을 때) 이전 조건의 목록과 커서가 남지 않게 비운다
    setItems([]);
    setNextCursor(null);
    setLoading(true);
    setError(null);
    listScrapeRuns(apiKey, { type, target, status, limit: PAGE_SIZE })
      .then(page => {
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(err => {
        if (!cancelled) handleError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey, type, target, status, reloadToken, handleError]);

  async function loadMore() {
    if (nextCursor === null || loadingMore) return;
    const requestedFor = filterKeyRef.current;
    setLoadingMore(true);
    try {
      const page = await listScrapeRuns(apiKey, {
        type,
        target,
        status,
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });
      if (filterKeyRef.current !== requestedFor) return;
      setItems(prev => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      if (filterKeyRef.current === requestedFor) handleError(err);
    } finally {
      setLoadingMore(false);
    }
  }

  const updateParam = useCallback(
    (key: 'type' | 'target' | 'status' | 'run', value: string | null) => {
      setParams(prev => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, value);
        // 다른 타입으로 바꾸면 이전 타입의 대상 필터는 의미가 없다
        if (key === 'type') next.delete('target');
        return next;
      });
    },
    [setParams],
  );

  const closePanel = useCallback(() => updateParam('run', null), [updateParam]);

  const hasFilter = Boolean(type || target || status);

  return (
    <div className="ad-page">
      <PageHeader title="실행 기록" />

      <div className="ad-filters">
        <FilterRow<ScrapeRunType>
          label="타입"
          options={SCRAPE_RUN_TYPES}
          value={type}
          labelOf={value => TYPE_LABELS[value]}
          onChange={value => updateParam('type', value ?? null)}
        />
        <FilterRow<ScrapeRunStatus>
          label="상태"
          options={SCRAPE_RUN_STATUSES}
          value={status}
          labelOf={value => STATUS_VIEWS[value].label}
          onChange={value => updateParam('status', value ?? null)}
        />
      </div>

      {target && (
        <Notice>
          {items[0]?.targetName ?? `대상 #${target}`}의 기록만 보고 있어요.{' '}
          <Button variant="ghost" size="sm" onClick={() => updateParam('target', null)}>
            대상 필터 해제
          </Button>
        </Notice>
      )}

      {error && (
        <Notice tone="danger">
          {error}{' '}
          <Button variant="ghost" size="sm" onClick={() => setReloadToken(token => token + 1)}>
            다시 시도
          </Button>
        </Notice>
      )}

      <div className={cx('ad-runs', selectedId !== null && 'has-panel')}>
        <Section
          title="실행 기록"
          collapsible={false}
          footer={
            nextCursor !== null && !loading ? (
              <Button variant="soft" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? '불러오는 중…' : '더 보기'}
              </Button>
            ) : undefined
          }
        >
          {items.length > 0 ? (
            <RunTable
              runs={items}
              now={now}
              caption="실행 기록"
              selectedId={selectedId}
              onSelect={run => updateParam('run', String(run.id))}
            />
          ) : (
            !loading &&
            !error &&
            (hasFilter ? (
              <EmptyState
                title="조건에 맞는 실행 기록이 없어요"
                action={
                  <Button variant="soft" onClick={() => setParams({})}>
                    필터 초기화
                  </Button>
                }
              />
            ) : (
              <EmptyState title="아직 실행 기록이 없어요" />
            ))
          )}
        </Section>

        {selectedId !== null && (
          <RunDetailPanel key={selectedId} runId={selectedId} onClose={closePanel} />
        )}
      </div>
    </div>
  );
}

interface FilterRowProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T | undefined;
  labelOf(value: T): string;
  onChange(value: T | undefined): void;
}

function FilterRow<T extends string>({ label, options, value, labelOf, onChange }: FilterRowProps<T>) {
  return (
    <div className="ad-filter-row">
      <span className="ad-filter-label" aria-hidden>
        {label}
      </span>
      <div className="jn-row" role="group" aria-label={label}>
        <Chip selected={value === undefined} onClick={() => onChange(undefined)}>
          전체
        </Chip>
        {options.map(option => (
          <Chip key={option} selected={value === option} onClick={() => onChange(option)}>
            {labelOf(option)}
          </Chip>
        ))}
      </div>
    </div>
  );
}
