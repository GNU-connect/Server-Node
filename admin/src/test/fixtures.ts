import {
  SCRAPE_RUN_TYPES,
  type ScrapeRun,
  type ScrapeRunType,
  type ScraperStatus,
  type ScraperTargetStatus,
} from '../api/types';

// 2026-09-25(금) 14:20 KST 시작, 1분 12초 걸린 성공 실행
export function makeRun(overrides: Partial<ScrapeRun> = {}): ScrapeRun {
  return {
    id: 1,
    type: 'shuttle',
    target: null,
    targetName: null,
    trigger: 'cron',
    status: 'succeeded',
    errorMessage: null,
    createdAt: '2026-09-25T05:20:00.000Z',
    startedAt: '2026-09-25T05:20:01.000Z',
    finishedAt: '2026-09-25T05:21:13.000Z',
    ...overrides,
  };
}

export function makeStatus(
  type: ScrapeRunType,
  latestRun: ScrapeRun | null,
  lastSucceededRun: ScrapeRun | null = latestRun?.status === 'succeeded' ? latestRun : null,
  targets: ScraperTargetStatus[] = [],
): ScraperStatus {
  return { type, latestRun, lastSucceededRun, targets };
}

/** 4개 타입 모두 성공 상태. overrides로 타입별 상태를 바꾼다. */
export function allStatuses(
  overrides: Partial<Record<ScrapeRunType, ScraperStatus>> = {},
): ScraperStatus[] {
  return SCRAPE_RUN_TYPES.map(
    (type, i) => overrides[type] ?? makeStatus(type, makeRun({ id: 100 + i, type })),
  );
}
