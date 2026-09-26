import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  SCRAPE_RUN_TYPES,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';

export class CreateScrapeRunRequestDto {
  @IsIn(SCRAPE_RUN_TYPES)
  @ApiProperty({ description: '수집 타입', enum: SCRAPE_RUN_TYPES, example: 'shuttle' })
  type: ScrapeRunType;
}
