import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThan, QueryFailedError, Repository } from 'typeorm';
import {
  ScrapeRun,
  ScrapeRunStatus,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';

const UNIQUE_VIOLATION = '23505';

export interface ScrapeRunSearchCondition {
  type?: ScrapeRunType;
  status?: ScrapeRunStatus;
  cursor?: number;
  limit: number;
}

@Injectable()
export class ScrapeRunRepository {
  constructor(
    @InjectRepository(ScrapeRun)
    private readonly scrapeRunRepository: Repository<ScrapeRun>,
  ) {}

  findMany({ type, status, cursor, limit }: ScrapeRunSearchCondition): Promise<ScrapeRun[]> {
    const where: FindOptionsWhere<ScrapeRun> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (cursor) where.id = LessThan(cursor);

    return this.scrapeRunRepository.find({ where, order: { id: 'DESC' }, take: limit });
  }

  findById(id: number): Promise<ScrapeRun | null> {
    return this.scrapeRunRepository.findOne({ where: { id } });
  }

  /** 타입별 가장 최근 run */
  findLatestPerType(): Promise<ScrapeRun[]> {
    return this.scrapeRunRepository
      .createQueryBuilder('run')
      .distinctOn(['run.type'])
      .orderBy('run.type')
      .addOrderBy('run.id', 'DESC')
      .getMany();
  }

  /** 타입별 가장 최근 성공 run */
  findLastSucceededPerType(): Promise<ScrapeRun[]> {
    return this.scrapeRunRepository
      .createQueryBuilder('run')
      .distinctOn(['run.type'])
      .where('run.status = :status', { status: 'succeeded' })
      .orderBy('run.type')
      .addOrderBy('run.id', 'DESC')
      .getMany();
  }

  /**
   * 수동 실행 요청을 대기 상태로 등록한다.
   * 같은 타입의 run이 이미 대기/실행 중이면 null을 반환한다.
   */
  async createPending(type: ScrapeRunType): Promise<ScrapeRun | null> {
    try {
      const run = this.scrapeRunRepository.create({ type, trigger: 'manual', status: 'pending' });
      const { id } = await this.scrapeRunRepository.save(run);
      return this.findById(id);
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
  );
}
