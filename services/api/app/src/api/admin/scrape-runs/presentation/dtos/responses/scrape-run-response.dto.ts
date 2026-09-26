import { ApiProperty } from '@nestjs/swagger';
import {
  SCRAPE_RUN_STATUSES,
  SCRAPE_RUN_TYPES,
  ScrapeRun,
  ScrapeRunStatus,
  ScrapeRunTrigger,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';

export class ScrapeRunResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: SCRAPE_RUN_TYPES })
  type: ScrapeRunType;

  @ApiProperty({ nullable: true, type: String, description: '수집 대상 id. 대상 없는 타입은 null' })
  target: string | null;

  @ApiProperty({ nullable: true, type: String, description: '수집 대상 이름(식당명, 카테고리명)' })
  targetName: string | null;

  @ApiProperty({ enum: ['cron', 'manual'] })
  trigger: ScrapeRunTrigger;

  @ApiProperty({ enum: SCRAPE_RUN_STATUSES })
  status: ScrapeRunStatus;

  @ApiProperty({ nullable: true, type: String })
  errorMessage: string | null;

  @ApiProperty({ description: '요청/생성 일시 (ISO 8601)' })
  createdAt: string;

  @ApiProperty({ nullable: true, type: String })
  startedAt: string | null;

  @ApiProperty({ nullable: true, type: String })
  finishedAt: string | null;

  static from(run: ScrapeRun, targetName: string | null = null): ScrapeRunResponseDto {
    return {
      id: Number(run.id),
      type: run.type,
      target: run.target,
      targetName,
      trigger: run.trigger,
      status: run.status,
      errorMessage: run.errorMessage,
      createdAt: run.createdAt.toISOString(),
      startedAt: run.startedAt?.toISOString() ?? null,
      finishedAt: run.finishedAt?.toISOString() ?? null,
    };
  }
}

export class ScrapeRunListResponseDto {
  @ApiProperty({ type: [ScrapeRunResponseDto] })
  items: ScrapeRunResponseDto[];

  @ApiProperty({
    nullable: true,
    type: Number,
    description: '다음 페이지 커서. 마지막 페이지면 null',
  })
  nextCursor: number | null;
}

export class ScraperTargetStatusResponseDto {
  @ApiProperty({ example: '1' })
  target: string;

  @ApiProperty({ example: '아람관' })
  targetName: string;

  @ApiProperty({ nullable: true, type: ScrapeRunResponseDto })
  latestRun: ScrapeRunResponseDto | null;

  @ApiProperty({ nullable: true, type: ScrapeRunResponseDto })
  lastSucceededRun: ScrapeRunResponseDto | null;
}

export class ScraperStatusResponseDto {
  @ApiProperty({ enum: SCRAPE_RUN_TYPES })
  type: ScrapeRunType;

  @ApiProperty({ nullable: true, type: ScrapeRunResponseDto })
  latestRun: ScrapeRunResponseDto | null;

  @ApiProperty({ nullable: true, type: ScrapeRunResponseDto })
  lastSucceededRun: ScrapeRunResponseDto | null;

  @ApiProperty({
    type: [ScraperTargetStatusResponseDto],
    description: '대상별 상태. 대상 없이 도는 타입은 빈 배열',
  })
  targets: ScraperTargetStatusResponseDto[];
}

export class CreateScrapeRunResponseDto {
  @ApiProperty({ type: [ScrapeRunResponseDto], description: '대기열에 등록된 run들' })
  runs: ScrapeRunResponseDto[];
}
