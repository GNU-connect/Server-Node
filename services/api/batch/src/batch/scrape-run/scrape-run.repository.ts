import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ScrapeRun, ScrapeRunTrigger } from './domain/scrape-run.entity';

const UNIQUE_VIOLATION = '23505';

export interface ClaimedScrapeRun {
  id: number;
  type: string;
  target: string | null;
}

@Injectable()
export class ScrapeRunRepository {
  constructor(
    @InjectRepository(ScrapeRun)
    private readonly repository: Repository<ScrapeRun>,
  ) {}

  /**
   * 바로 실행 상태의 run을 만든다.
   * 같은 (타입, 대상)의 run이 이미 대기/실행 중이면 null을 반환한다.
   */
  async start(
    type: string,
    trigger: ScrapeRunTrigger,
    target: string | null = null,
  ): Promise<number | null> {
    try {
      const rows: { id: number }[] = await this.repository.query(
        `INSERT INTO scrape_run (type, trigger, target, status, started_at)
         VALUES ($1, $2, $3, 'running', now())
         RETURNING id`,
        [type, trigger, target],
      );
      return Number(rows[0].id);
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  /** 가장 오래된 대기 중 run 하나를 실행 상태로 바꾸고 반환한다. */
  async claimPending(): Promise<ClaimedScrapeRun | null> {
    const [rows]: [
      { id: number; type: string; target: string | null }[],
      number,
    ] = await this.repository.query(
      `UPDATE scrape_run
         SET status = 'running', started_at = now()
         WHERE id = (
           SELECT id FROM scrape_run
           WHERE status = 'pending'
           ORDER BY id
           LIMIT 1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING id, type, target`,
    );
    if (!rows || rows.length === 0) return null;
    return {
      id: Number(rows[0].id),
      type: rows[0].type,
      target: rows[0].target ?? null,
    };
  }

  async succeed(id: number): Promise<void> {
    await this.repository.query(
      `UPDATE scrape_run SET status = 'succeeded', finished_at = now() WHERE id = $1`,
      [id],
    );
  }

  async fail(id: number, errorMessage: string): Promise<void> {
    await this.repository.query(
      `UPDATE scrape_run
       SET status = 'failed', finished_at = now(), error_message = $2
       WHERE id = $1`,
      [id, errorMessage],
    );
  }

  /** 프로세스 종료로 실행 중 상태에 남은 run을 실패 처리한다. */
  async failInterrupted(): Promise<number> {
    const [, affected]: [unknown, number] = await this.repository.query(
      `UPDATE scrape_run
       SET status = 'failed', finished_at = now(),
           error_message = '배치 프로세스 재시작으로 중단됨'
       WHERE status = 'running'`,
    );
    return affected;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
  );
}
