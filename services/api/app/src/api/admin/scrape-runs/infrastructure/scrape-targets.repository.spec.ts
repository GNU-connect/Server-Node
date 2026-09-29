import { ScrapeTargetsRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-targets.repository';
import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { NoticeCategory } from 'src/api/public/notices/domain/entities/notice-category.entity';
import { Repository } from 'typeorm';

describe('ScrapeTargetsRepository', () => {
  let cafeteriaRepository: jest.Mocked<Repository<Cafeteria>>;
  let noticeCategoryRepository: jest.Mocked<Repository<NoticeCategory>>;
  let repository: ScrapeTargetsRepository;

  beforeEach(() => {
    cafeteriaRepository = { find: jest.fn() } as unknown as jest.Mocked<Repository<Cafeteria>>;
    noticeCategoryRepository = { find: jest.fn() } as unknown as jest.Mocked<
      Repository<NoticeCategory>
    >;
    repository = new ScrapeTargetsRepository(cafeteriaRepository, noticeCategoryRepository);
  });

  describe('findByType', () => {
    it('학식은 캠퍼스, 식당 순서의 메타데이터를 반환한다', async () => {
      cafeteriaRepository.find.mockResolvedValue([
        { id: 1, name: '아람관', campus: { name: '가좌캠퍼스' } },
        { id: 4, name: '교직원식당', campus: { name: '가좌캠퍼스' } },
      ] as Cafeteria[]);

      const targets = await repository.findByType('cafeteria');

      expect(cafeteriaRepository.find).toHaveBeenCalledWith({
        relations: { campus: true },
        order: { id: 'ASC' },
      });
      expect(targets).toEqual([
        {
          id: '1',
          meta: [
            { label: '캠퍼스', value: '가좌캠퍼스' },
            { label: '식당', value: '아람관' },
          ],
        },
        {
          id: '4',
          meta: [
            { label: '캠퍼스', value: '가좌캠퍼스' },
            { label: '식당', value: '교직원식당' },
          ],
        },
      ]);
    });

    it('대학 공지는 게시판 메타데이터만 반환한다', async () => {
      noticeCategoryRepository.find.mockResolvedValue([
        { id: 3, category: '일반공지' },
      ] as NoticeCategory[]);

      const targets = await repository.findByType('university-notice');

      expect(targets).toEqual([{ id: '3', meta: [{ label: '게시판', value: '일반공지' }] }]);
    });

    it('대상 없이 도는 타입은 null을 반환한다', async () => {
      await expect(repository.findByType('shuttle')).resolves.toBeNull();
    });
  });
});
