import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getDietTime, getTodayOrTomorrow } from 'src/api/public/cafeterias/utils/time';
import { CafeteriasService } from 'src/api/public/cafeterias/cafeterias.service';
import { CafeteriasRepository } from 'src/type-orm/entities/cafeterias/cafeterias.repository';

@Injectable()
export class WarmupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WarmupService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly cafeteriasService: CafeteriasService,
    private readonly cafeteriasRepository: CafeteriasRepository,
  ) {}

  onApplicationBootstrap() {
    this.scheduledWarmup();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledWarmup() {
    try {
      await this.runWarmup();
    } catch (err: unknown) {
      this.logger.warn(
        `scheduled warmup failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async runWarmup(): Promise<WarmupResult> {
    const start = performance.now();

    const [dbMs, cpuMs] = await Promise.all([
      this.pingDatabase(),
      this.exerciseCpuHotPaths(),
    ]);

    const cacheMs = await this.prewarmDietCache();

    const totalMs = +(performance.now() - start).toFixed(2);
    this.logger.log(
      `warmup ok — total=${totalMs}ms db=${dbMs}ms cpu=${cpuMs}ms cache=${cacheMs}ms`,
    );

    return { ok: true, totalMs, dbMs, cpuMs, cacheMs };
  }

  // ── private helpers ─────────────────────────────────────────────────────────

  private async pingDatabase(): Promise<number> {
    const t = performance.now();
    await this.dataSource.query('SELECT 1');
    return +(performance.now() - t).toFixed(2);
  }

  /**
   * Idle 이후 첫 요청에서 병목이 발생하는 V8 JIT 핫패스를 미리 실행.
   *
   * 대상:
   *  - Date 산술 / KST 변환  (getTodayOrTomorrow, getDietTime)
   *  - JSON.parse / JSON.stringify
   *  - 문자열 포맷팅 (toISOString, slice)
   *  - 간단한 배열 연산
   */
  private exerciseCpuHotPaths(): number {
    const t = performance.now();

    // 1. 날짜 계산 (cafeterias.service와 동일한 코드 경로)
    const date = getTodayOrTomorrow();
    getDietTime(date);
    date.toISOString().slice(0, 10);

    // 2. JSON 직렬화 / 역직렬화
    const sample = {
      id: 1,
      name: 'warmup',
      date: date.toISOString(),
      items: Array.from({ length: 10 }, (_, i) => ({ id: i, value: `item-${i}` })),
    };
    JSON.parse(JSON.stringify(sample));

    // 3. 문자열 / 배열 조작
    const tags = ['아침', '점심', '저녁'];
    tags.map((t) => t.repeat(3)).join(',');

    return +(performance.now() - t).toFixed(2);
  }

  /**
   * 모든 식당의 현재 식단을 캐시에 pre-population.
   * warmup 주기(5분)마다 실행되므로, TTL(10분)과 함께 캐시가 항상 warm 상태로 유지됨.
   */
  private async prewarmDietCache(): Promise<number> {
    const t = performance.now();

    try {
      const cafeterias = await this.cafeteriasRepository.findCafeteriasByCampusId();
      await Promise.allSettled(
        cafeterias.map((cafeteria) =>
          this.cafeteriasService.getCafeteriaDiet(cafeteria.id),
        ),
      );
      this.logger.log(`diet cache prewarmed — count=${cafeterias.length}`);
    } catch (err: unknown) {
      this.logger.warn(
        `diet cache prewarm failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return +(performance.now() - t).toFixed(2);
  }
}

export interface WarmupResult {
  ok: boolean;
  totalMs: number;
  dbMs: number;
  cpuMs: number;
  cacheMs: number;
}
