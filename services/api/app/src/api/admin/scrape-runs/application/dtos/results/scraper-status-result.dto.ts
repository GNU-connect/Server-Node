import {
  ScrapeRun,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';

export interface ScraperTargetStatusResult {
  target: string;
  targetName: string;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
}

export interface ScraperStatusResult {
  type: ScrapeRunType;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
  /** 대상 없이 도는 타입은 빈 배열 */
  targets: ScraperTargetStatusResult[];
}

export interface ScrapeRunListResult {
  runs: ScrapeRun[];
  nextCursor: number | null;
}
