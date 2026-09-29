import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { ScrapeTargetsRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-targets.repository';

export function targetKey(type: ScrapeRunType, target: string): string {
  return `${type}:${target}`;
}

@Injectable()
export class ScrapeRunsService {
  constructor(
    private readonly scrapeRunRepository: ScrapeRunRepository,
    private readonly scrapeTargetsRepository: ScrapeTargetsRepository,
  ) {}

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

  /**
   * 수동 실행을 대기열에 등록한다.
   * - 대상 없는 타입: run 하나
   * - 대상 있는 타입 + target: 그 대상의 run 하나
   * - 대상 있는 타입 + target 없음: 대상마다 run 하나(진행 중인 대상은 건너뜀)
   */
  public async requestRun(type: ScrapeRunType, target?: string): Promise<ScrapeRun[]> {
    const targets = await this.scrapeTargetsRepository.findByType(type);

    if (targets === null) {
      if (target !== undefined) {
        throw new BadRequestException(`'${type}' 수집은 대상을 지정할 수 없습니다.`);
      }
      return [await this.createPendingOrConflict(type, null)];
    }

    if (target !== undefined) {
      if (!targets.some(item => item.id === target)) {
        throw new BadRequestException(`'${type}' 수집에 '${target}' 대상이 없습니다.`);
      }
      return [await this.createPendingOrConflict(type, target)];
    }

    if (targets.length === 0) {
      throw new BadRequestException(`'${type}' 수집 대상이 없습니다.`);
    }

    const runs: ScrapeRun[] = [];
    for (const item of targets) {
      const run = await this.scrapeRunRepository.createPending(type, item.id);
      if (run) runs.push(run);
    }
    if (runs.length === 0) {
      throw new ConflictException(`'${type}' 수집이 모든 대상에서 이미 대기 또는 실행 중입니다.`);
    }
    return runs;
  }

  /** run 목록의 대상 id를 이름으로 바꾸기 위한 맵. 키는 targetKey(type, target). */
  public async getTargetNames(runs: ScrapeRun[]): Promise<Map<string, string>> {
    const types = [...new Set(runs.filter(run => run.target !== null).map(run => run.type))];
    const found = await Promise.all(
      types.map(async type => [type, await this.scrapeTargetsRepository.findByType(type)] as const),
    );

    const names = new Map<string, string>();
    for (const [type, targets] of found) {
      for (const item of targets ?? []) names.set(targetKey(type, item.id), item.name);
    }
    return names;
  }

  public async getScraperStatuses(): Promise<ScraperStatusResult[]> {
    const [latestRuns, succeededRuns, latestTargetRuns, succeededTargetRuns] = await Promise.all([
      this.scrapeRunRepository.findLatestPerType(),
      this.scrapeRunRepository.findLastSucceededPerType(),
      this.scrapeRunRepository.findLatestPerTarget(),
      this.scrapeRunRepository.findLastSucceededPerTarget(),
    ]);

    return Promise.all(
      SCRAPE_RUN_TYPES.map(async type => {
        const targets = await this.scrapeTargetsRepository.findByType(type);
        return {
          type,
          latestRun: latestRuns.find(run => run.type === type) ?? null,
          lastSucceededRun: succeededRuns.find(run => run.type === type) ?? null,
          targets: (targets ?? []).map(item => ({
            target: item.id,
            targetName: item.name,
            latestRun:
              latestTargetRuns.find(run => run.type === type && run.target === item.id) ?? null,
            lastSucceededRun:
              succeededTargetRuns.find(run => run.type === type && run.target === item.id) ?? null,
          })),
        };
      }),
    );
  }

  private async createPendingOrConflict(
    type: ScrapeRunType,
    target: string | null,
  ): Promise<ScrapeRun> {
    const run = await this.scrapeRunRepository.createPending(type, target);
    if (!run) {
      const label = target === null ? type : `${type}:${target}`;
      throw new ConflictException(`'${label}' 수집이 이미 대기 또는 실행 중입니다.`);
    }
    return run;
  }
}
