import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  SCRAPE_RUN_TYPES,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';

export class CreateScrapeRunRequestDto {
  @IsIn(SCRAPE_RUN_TYPES)
  @ApiProperty({ description: '수집 타입', enum: SCRAPE_RUN_TYPES, example: 'cafeteria' })
  type: ScrapeRunType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional({
    description: '수집 대상(식당 id, 공지 카테고리 id). 없으면 타입 전체(대상마다 run 생성)',
    example: '1',
  })
  target?: string;
}
