import { Injectable } from '@nestjs/common';
import { BatchJob } from '../batch-job.interface';
import { CafeteriaClient } from './cafeteria.client';
import { CafeteriaParser } from './cafeteria.parser';
import { CafeteriaRepository } from './cafeteria.repository';

@Injectable()
export class CafeteriaJob implements BatchJob {
  readonly name = 'cafeteria';

  constructor(
    private readonly client: CafeteriaClient,
    private readonly parser: CafeteriaParser,
    private readonly repository: CafeteriaRepository,
  ) {}

  /** 식당마다 scrape_run을 남기기 위해 식당 id를 대상으로 돌려준다. */
  async targets(): Promise<string[]> {
    const cafeterias = await this.repository.findAll();
    return cafeterias.map((cafeteria) => String(cafeteria.id));
  }

  async run(target?: string): Promise<void> {
    if (target === undefined) {
      throw new Error('cafeteria 수집에는 target(식당 id)이 필요합니다.');
    }

    const cafeteriaId = Number(target);
    if (!Number.isInteger(cafeteriaId)) {
      throw new Error(`올바르지 않은 식당 id입니다: ${target}`);
    }

    const cafeteria = await this.repository.findById(cafeteriaId);
    if (!cafeteria) {
      throw new Error(`식당을 찾을 수 없습니다: ${target}`);
    }

    const raw = await this.client.fetch(cafeteria);
    const menu = this.parser.parse(raw, {
      name: cafeteria.name,
      formType: cafeteria.formType,
    });

    // 휴무 주간처럼 메뉴가 없으면 기존 식단을 그대로 둔다.
    if (menu.dishes.length === 0) return;

    await this.repository.replaceWeek(
      cafeteria.id,
      { startDate: menu.startDate, endDate: menu.endDate },
      menu.dishes,
    );
  }
}
