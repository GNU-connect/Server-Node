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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiAcceptedResponse, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminApiKeyGuard } from 'src/api/admin/common/guards/admin-api-key.guard';
import { ScrapeRunsService } from 'src/api/admin/scrape-runs/application/scrape-runs.service';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import { CreateScrapeRunRequestDto } from './dtos/requests/create-scrape-run-request.dto';
import { ListScrapeRunsQueryDto } from './dtos/requests/list-scrape-runs-query.dto';
import {
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
      status: query.status,
      cursor: query.cursor,
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
    });
    return new NativeResponseDto({
      items: result.runs.map(ScrapeRunResponseDto.from),
      nextCursor: result.nextCursor,
    });
  }

  @Get('scrape-runs/:id')
  @ApiOkResponse({ type: NativeResponseDto<ScrapeRunResponseDto> })
  async getRun(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NativeResponseDto<ScrapeRunResponseDto>> {
    const run = await this.scrapeRunsService.getRun(id);
    return new NativeResponseDto(ScrapeRunResponseDto.from(run));
  }

  @Post('scrape-runs')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({
    type: NativeResponseDto<ScrapeRunResponseDto>,
    description: '수집 요청이 대기열에 등록됨. 배치가 폴링해 실행한다',
  })
  async requestRun(
    @Body() body: CreateScrapeRunRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NativeResponseDto<ScrapeRunResponseDto>> {
    const run = await this.scrapeRunsService.requestRun(body.type);
    res.location(`/api/admin/scrape-runs/${run.id}`);
    return new NativeResponseDto(ScrapeRunResponseDto.from(run), 'Accepted', HttpStatus.ACCEPTED);
  }
}
