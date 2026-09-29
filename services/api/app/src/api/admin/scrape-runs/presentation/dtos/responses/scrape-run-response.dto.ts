import { ApiProperty } from '@nestjs/swagger';
import {
  SCRAPE_RUN_STATUSES,
  SCRAPE_RUN_TYPES,
  ScrapeRun,
  ScrapeRunStatus,
  ScrapeRunTrigger,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import {
  ScrapeTargetMeta,
  targetNameOf,
} from 'src/api/admin/scrape-runs/infrastructure/scrape-targets.repository';

export class ScrapeTargetMetaResponseDto implements ScrapeTargetMeta {
  @ApiProperty({ example: '캠퍼스' })
  label: string;

  @ApiProperty({ example: '가좌캠퍼스' })
  value: string;
}

export class ScrapeRunResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: SCRAPE_RUN_TYPES })
  type: ScrapeRunType;

  @ApiProperty({ nullable: true, type: String, description: '수집 대상 id. 대상 없는 타입은 null' })
  target: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: '수집 대상 대표 이름(targetMeta의 마지막 값: 식당명, 게시판명)',
  })
  targetName: string | null;

  @ApiProperty({
    type: [ScrapeTargetMetaResponseDto],
    description: '수집 대상 메타데이터. 일반 → 구체 순서(예: 캠퍼스, 식당). 대상이 없으면 빈 배열',
  })
  targetMeta: ScrapeTargetMetaResponseDto[];

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

  static from(run: ScrapeRun, targetMeta: ScrapeTargetMeta[] = []): ScrapeRunResponseDto {
    return {
      id: Number(run.id),
      type: run.type,
      target: run.target,
      targetName: targetNameOf(targetMeta),
      targetMeta,
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
