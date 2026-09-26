export const SCRAPE_RUN_TYPES = [
  'shuttle',
  'university-notice',
  'cafeteria',
  'academic-calendar',
] as const;
export type ScrapeRunType = (typeof SCRAPE_RUN_TYPES)[number];

export const SCRAPE_RUN_STATUSES = ['pending', 'running', 'succeeded', 'failed'] as const;
export type ScrapeRunStatus = (typeof SCRAPE_RUN_STATUSES)[number];

export type ScrapeRunTrigger = 'cron' | 'manual';

export interface ScrapeRun {
  id: number;
  type: ScrapeRunType;
  /** 수집 대상 id(식당, 공지 카테고리). 대상 없는 타입은 null */
  target: string | null;
  /** 수집 대상 이름 */
  targetName: string | null;
  trigger: ScrapeRunTrigger;
  status: ScrapeRunStatus;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ScraperTargetStatus {
  target: string;
  targetName: string;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
}

export interface ScraperStatus {
  type: ScrapeRunType;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
  /** 대상 없이 도는 타입은 빈 배열 */
  targets: ScraperTargetStatus[];
}

export interface ScrapeRunPage {
  items: ScrapeRun[];
  nextCursor: number | null;
}

export interface ListScrapeRunsParams {
  type?: ScrapeRunType;
  target?: string;
  status?: ScrapeRunStatus;
  cursor?: number;
  limit?: number;
}
