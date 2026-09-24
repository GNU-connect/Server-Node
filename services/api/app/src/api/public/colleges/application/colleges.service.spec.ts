import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { College } from 'src/api/public/colleges/domain/entities/college.entity';
import { CollegesRepository } from 'src/api/public/colleges/infrastructure/colleges.repository';
import { CollegesService } from 'src/api/public/colleges/application/colleges.service';

const makeCollege = (overrides: Partial<College> = {}): College =>
  ({
    id: 1,
    name: '공과대학',
    thumbnailUrl: 'https://example.com/college.jpg',
    ...overrides,
  } as College);

describe('CollegesService', () => {
  let service: CollegesService;
  let collegesRepository: jest.Mocked<CollegesRepository>;
  let cacheManager: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollegesService,
        {
          provide: CollegesRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CollegesService>(CollegesService);
    collegesRepository = module.get(CollegesRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('page와 pageSize로 단과대학 목록을 조회한다', async () => {
    collegesRepository.findAll.mockResolvedValue([[makeCollege()], 1]);

    const result = await service.findAll(2, 10);

    expect(collegesRepository.findAll).toHaveBeenCalledWith(2, 10);
    expect(result).toEqual({
      colleges: [
        {
          id: 1,
          name: '공과대학',
          thumbnailUrl: 'https://example.com/college.jpg',
        },
      ],
      total: 1,
    });
  });

  it('page가 1보다 작으면 1로 보정한다', async () => {
    collegesRepository.findAll.mockResolvedValue([[], 0]);

    await service.findAll(0, 10);

    expect(collegesRepository.findAll).toHaveBeenCalledWith(1, 10);
  });

  it('cache miss이면 pageSize를 포함한 캐시 키로 저장한다', async () => {
    collegesRepository.findAll.mockResolvedValue([[], 0]);

    const result = await service.findAll(0, 10);

    expect(cacheManager.set).toHaveBeenCalledWith('colleges:page:1:size:10', result);
  });
});
