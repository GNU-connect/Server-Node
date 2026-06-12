import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Department } from 'src/api/public/departments/domain/entities/department.entity';
import { DepartmentsRepository } from 'src/api/public/departments/infrastructure/departments.repository';
import { DepartmentsService } from 'src/api/public/departments/application/departments.service';

const makeDepartment = (overrides: Partial<Department> = {}): Department =>
  ({
    id: 1,
    name: '컴퓨터공학부',
    ...overrides,
  } as Department);

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let departmentsRepository: jest.Mocked<DepartmentsRepository>;
  let cacheManager: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: DepartmentsRepository,
          useValue: {
            findByCollegeId: jest.fn(),
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

    service = module.get<DepartmentsService>(DepartmentsService);
    departmentsRepository = module.get(DepartmentsRepository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('collegeId, page, pageSize로 학과 목록을 조회한다', async () => {
    departmentsRepository.findByCollegeId.mockResolvedValue([[makeDepartment()], 1]);

    const result = await service.findAll(3, 2, 10);

    expect(departmentsRepository.findByCollegeId).toHaveBeenCalledWith(3, 2, 10);
    expect(result).toEqual({
      departments: [
        {
          id: 1,
          name: '컴퓨터공학부',
        },
      ],
      total: 1,
    });
  });

  it('page가 1보다 작으면 1로 보정한다', async () => {
    departmentsRepository.findByCollegeId.mockResolvedValue([[], 0]);

    await service.findAll(3, 0, 10);

    expect(departmentsRepository.findByCollegeId).toHaveBeenCalledWith(3, 1, 10);
  });

  it('cache miss이면 pageSize를 포함한 캐시 키로 저장한다', async () => {
    departmentsRepository.findByCollegeId.mockResolvedValue([[], 0]);

    const result = await service.findAll(3, 0, 10);

    expect(cacheManager.set).toHaveBeenCalledWith('departments:college:3:page:1:size:10', result);
  });
});
