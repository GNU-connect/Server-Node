import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ScrapeRunListResult,
  ScraperStatusResult,
} from 'src/api/admin/scrape-runs/application/dtos/results/scraper-status-result.dto';
import {
  SCRAPE_RUN_TYPES,
  ScrapeRun,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import {
  ScrapeRunRepository,
  ScrapeRunSearchCondition,
} from 'src/api/admin/scrape-runs/infrastructure/scrape-run.repository';

@Injectable()
export class ScrapeRunsService {
  constructor(private readonly scrapeRunRepository: ScrapeRunRepository) {}

  public async getRuns(condition: ScrapeRunSearchCondition): Promise<ScrapeRunListResult> {
    // 다음 페이지 존재 여부 확인을 위해 하나 더 조회한다
    const runs = await this.scrapeRunRepository.findMany({
      ...condition,
      limit: condition.limit + 1,
    });
    const hasNext = runs.length > condition.limit;
    const page = hasNext ? runs.slice(0, condition.limit) : runs;

    return {
      runs: page,
      nextCursor: hasNext ? Number(page[page.length - 1].id) : null,
    };
  }

  public async getRun(id: number): Promise<ScrapeRun> {
    const run = await this.scrapeRunRepository.findById(id);
    if (!run) {
      throw new NotFoundException(`${id}번 수집 실행 기록을 찾을 수 없습니다.`);
    }
    return run;
  }

  public async requestRun(type: ScrapeRunType): Promise<ScrapeRun> {
    const run = await this.scrapeRunRepository.createPending(type);
    if (!run) {
      throw new ConflictException(`'${type}' 수집이 이미 대기 또는 실행 중입니다.`);
    }
    return run;
  }

  public async getScraperStatuses(): Promise<ScraperStatusResult[]> {
    const [latestRuns, succeededRuns] = await Promise.all([
      this.scrapeRunRepository.findLatestPerType(),
      this.scrapeRunRepository.findLastSucceededPerType(),
    ]);

    return SCRAPE_RUN_TYPES.map(type => ({
      type,
      latestRun: latestRuns.find(run => run.type === type) ?? null,
      lastSucceededRun: succeededRuns.find(run => run.type === type) ?? null,
    }));
  }
}
