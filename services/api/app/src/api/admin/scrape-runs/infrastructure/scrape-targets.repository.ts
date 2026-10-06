import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScrapeRunType } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { NoticeCategory } from 'src/api/public/notices/domain/entities/notice-category.entity';
import { Repository } from 'typeorm';

const UNIVERSITY_DEPARTMENT_ID = 117;

/** 대상을 설명하는 항목 하나. 화면에 라벨과 함께 표시된다. */
export interface ScrapeTargetMeta {
  label: string;
  value: string;
}

export interface ScrapeTarget {
  id: string;
  /** 일반 → 구체 순서 (예: [캠퍼스, 식당]). 마지막 항목이 대상을 가장 구체적으로 가리킨다. */
  meta: ScrapeTargetMeta[];
}

/** 대상의 대표 이름. 메타데이터의 마지막(가장 구체적인) 값이다. */
export function targetNameOf(meta: ScrapeTargetMeta[]): string | null {
  return meta.length === 0 ? null : meta[meta.length - 1].value;
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
      case 'cafeteria':
        return this.findCafeteriaTargets();
      case 'university-notice':
        return this.findUniversityNoticeTargets();
      default:
        return null;
    }
  }

  private async findCafeteriaTargets(): Promise<ScrapeTarget[]> {
    const cafeterias = await this.cafeteriaRepository.find({
      relations: { campus: true },
      order: { id: 'ASC' },
    });
    return cafeterias.map(cafeteria => ({
      id: String(cafeteria.id),
      meta: [
        { label: '캠퍼스', value: cafeteria.campus.name },
        { label: '식당', value: cafeteria.name },
      ],
    }));
  }

  private async findUniversityNoticeTargets(): Promise<ScrapeTarget[]> {
    const categories = await this.noticeCategoryRepository.find({
      where: { departmentId: UNIVERSITY_DEPARTMENT_ID },
      order: { id: 'ASC' },
    });
    return categories.map(category => ({
      id: String(category.id),
      meta: [{ label: '게시판', value: category.category }],
    }));
  }
}
