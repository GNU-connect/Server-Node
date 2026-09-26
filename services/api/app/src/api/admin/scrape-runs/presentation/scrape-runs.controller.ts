import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiAcceptedResponse, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminApiKeyGuard } from 'src/api/admin/common/guards/admin-api-key.guard';
import {
  ScrapeRunsService,
  targetKey,
} from 'src/api/admin/scrape-runs/application/scrape-runs.service';
import { ScrapeRun } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import { CreateScrapeRunRequestDto } from './dtos/requests/create-scrape-run-request.dto';
import { ListScrapeRunsQueryDto } from './dtos/requests/list-scrape-runs-query.dto';
import {
  CreateScrapeRunResponseDto,
  ScrapeRunListResponseDto,
  ScrapeRunResponseDto,
  ScraperStatusResponseDto,
} from './dtos/responses/scrape-run-response.dto';

const DEFAULT_PAGE_SIZE = 20;

@ApiTags('admin')
@ApiSecurity('X-ADMIN-API-KEY')
@Controller('admin')
@UseGuards(AdminApiKeyGuard)
export class ScrapeRunsController {
  constructor(private readonly scrapeRunsService: ScrapeRunsService) {}

  @Get('scrapers')
  @ApiOkResponse({ type: NativeResponseDto<ScraperStatusResponseDto[]> })
  async getScraperStatuses(): Promise<NativeResponseDto<ScraperStatusResponseDto[]>> {
    const statuses = await this.scrapeRunsService.getScraperStatuses();
    const data = statuses.map(status => ({
      type: status.type,
      latestRun: status.latestRun && ScrapeRunResponseDto.from(status.latestRun),
      lastSucceededRun:
        status.lastSucceededRun && ScrapeRunResponseDto.from(status.lastSucceededRun),
      targets: status.targets.map(item => ({
        target: item.target,
        targetName: item.targetName,
        latestRun: item.latestRun && ScrapeRunResponseDto.from(item.latestRun, item.targetName),
        lastSucceededRun:
          item.lastSucceededRun &&
          ScrapeRunResponseDto.from(item.lastSucceededRun, item.targetName),
      })),
    }));
    return new NativeResponseDto(data);
  }

  @Get('scrape-runs')
  @ApiOkResponse({ type: NativeResponseDto<ScrapeRunListResponseDto> })
  async getRuns(
    @Query() query: ListScrapeRunsQueryDto,
  ): Promise<NativeResponseDto<ScrapeRunListResponseDto>> {
    const result = await this.scrapeRunsService.getRuns({
      type: query.type,
      target: query.target,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
    });
    const names = await this.scrapeRunsService.getTargetNames(result.runs);
    return new NativeResponseDto({
      items: result.runs.map(run => ScrapeRunResponseDto.from(run, this.nameOf(names, run))),
      nextCursor: result.nextCursor,
    });
  }

  @Get('scrape-runs/:id')
  @ApiOkResponse({ type: NativeResponseDto<ScrapeRunResponseDto> })
  async getRun(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NativeResponseDto<ScrapeRunResponseDto>> {
    const run = await this.scrapeRunsService.getRun(id);
    const names = await this.scrapeRunsService.getTargetNames([run]);
    return new NativeResponseDto(ScrapeRunResponseDto.from(run, this.nameOf(names, run)));
  }

  @Post('scrape-runs')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({
    type: NativeResponseDto<CreateScrapeRunResponseDto>,
    description: '수집 요청이 대기열에 등록됨. 배치가 폴링해 실행한다',
  })
  async requestRun(
    @Body() body: CreateScrapeRunRequestDto,
  ): Promise<NativeResponseDto<CreateScrapeRunResponseDto>> {
    const runs = await this.scrapeRunsService.requestRun(body.type, body.target);
    const names = await this.scrapeRunsService.getTargetNames(runs);
    return new NativeResponseDto(
      { runs: runs.map(run => ScrapeRunResponseDto.from(run, this.nameOf(names, run))) },
      'Accepted',
      HttpStatus.ACCEPTED,
    );
  }

  private nameOf(names: Map<string, string>, run: ScrapeRun): string | null {
    return run.target === null ? null : names.get(targetKey(run.type, run.target)) ?? null;
  }
}
