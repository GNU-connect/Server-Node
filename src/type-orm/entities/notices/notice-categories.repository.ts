import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NoticeCategory } from 'src/type-orm/entities/notices/notice-category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NoticeCategoriesRepository {
  constructor(
    @InjectRepository(NoticeCategory)
    private readonly noticeCategoryRepository: Repository<NoticeCategory>,
  ) {}

  /**
   * 특정 학과/학교의 카테고리 목록 조회
   * @param departmentId 학과 ID (117: 학교 공지)
   * @returns 카테고리 목록
   */
  findByDepartmentId(departmentId: number): Promise<NoticeCategory[]> {
    return this.noticeCategoryRepository.find({
      where: {
        departmentId,
      },
      order: {
        category: 'ASC',
      },
    });
  }

  /**
   * 특정 카테고리명으로 학교 공지 카테고리 조회
   * @param departmentId 학과 ID
   * @param categoryName 카테고리명
   * @returns 카테고리 정보
   */
  findByDepartmentIdAndCategory(
    departmentId: number,
    categoryName: string,
  ): Promise<NoticeCategory | null> {
    return this.noticeCategoryRepository.findOne({
      where: {
        departmentId,
        category: categoryName,
      },
    });
  }

  /**
   * 특정 학과/학교의 특정 카테고리명들 조회
   * @param departmentId 학과 ID
   * @param categoryNames 카테고리명 배열
   * @returns 카테고리 목록
   */
  findByDepartmentIdAndCategories(
    departmentId: number,
    categoryNames: string[],
  ): Promise<NoticeCategory[]> {
    return this.noticeCategoryRepository
      .createQueryBuilder('category')
      .where('category.department_id = :departmentId', { departmentId })
      .andWhere('category.category IN (:...categoryNames)', { categoryNames })
      .getMany();
  }
}
