import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScrapeRunType } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { NoticeCategory } from 'src/api/public/notices/domain/entities/notice-category.entity';
import { Repository } from 'typeorm';

const UNIVERSITY_DEPARTMENT_ID = 117;

export interface ScrapeTarget {
  id: string;
  name: string;
}

@Injectable()
export class ScrapeTargetsRepository {
  constructor(
    @InjectRepository(Cafeteria)
    private readonly cafeteriaRepository: Repository<Cafeteria>,
    @InjectRepository(NoticeCategory)
    private readonly noticeCategoryRepository: Repository<NoticeCategory>,
  ) {}

  /** 수집 대상 목록. 대상 없이 도는 타입이면 null을 반환한다. */
  async findByType(type: ScrapeRunType): Promise<ScrapeTarget[] | null> {
    switch (type) {
      case 'cafeteria': {
        const cafeterias = await this.cafeteriaRepository.find({ order: { id: 'ASC' } });
        return cafeterias.map(cafeteria => ({ id: String(cafeteria.id), name: cafeteria.name }));
      }
      case 'university-notice': {
        const categories = await this.noticeCategoryRepository.find({
          where: { departmentId: UNIVERSITY_DEPARTMENT_ID },
          order: { id: 'ASC' },
        });
        return categories.map(category => ({ id: String(category.id), name: category.category }));
      }
      default:
        return null;
    }
  }
}
