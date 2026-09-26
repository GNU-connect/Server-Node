import {
  ScrapeRun,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';

export interface ScraperStatusResult {
  type: ScrapeRunType;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
}

export interface ScrapeRunListResult {
  runs: ScrapeRun[];
  nextCursor: number | null;
}
