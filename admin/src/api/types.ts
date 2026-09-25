export const SCRAPE_RUN_TYPES = ['shuttle', 'notice', 'cafeteria', 'academic-calendar'] as const;
export type ScrapeRunType = (typeof SCRAPE_RUN_TYPES)[number];

export const SCRAPE_RUN_STATUSES = ['pending', 'running', 'succeeded', 'failed'] as const;
export type ScrapeRunStatus = (typeof SCRAPE_RUN_STATUSES)[number];

export type ScrapeRunTrigger = 'cron' | 'manual';

export interface ScrapeRun {
  id: number;
  type: ScrapeRunType;
  trigger: ScrapeRunTrigger;
  status: ScrapeRunStatus;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ScraperStatus {
  type: ScrapeRunType;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
}

export interface ScrapeRunPage {
  items: ScrapeRun[];
  nextCursor: number | null;
}

export interface ListScrapeRunsParams {
  type?: ScrapeRunType;
  status?: ScrapeRunStatus;
  cursor?: number;
  limit?: number;
}
