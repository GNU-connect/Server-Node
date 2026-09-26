import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  SCRAPE_RUN_STATUSES,
  SCRAPE_RUN_TYPES,
  ScrapeRunStatus,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';

export class ListScrapeRunsQueryDto {
  @IsOptional()
  @IsIn(SCRAPE_RUN_TYPES)
  @ApiPropertyOptional({ description: '수집 타입', enum: SCRAPE_RUN_TYPES })
  type?: ScrapeRunType;

  @IsOptional()
  @IsIn(SCRAPE_RUN_STATUSES)
  @ApiPropertyOptional({ description: '실행 상태', enum: SCRAPE_RUN_STATUSES })
  status?: ScrapeRunStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: '이전 페이지의 nextCursor. 이 id보다 오래된 run을 조회' })
  cursor?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({ description: '페이지 크기', default: 20, maximum: 100 })
  limit?: number;
}
