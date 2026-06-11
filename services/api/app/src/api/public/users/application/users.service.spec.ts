import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/api/public/users/application/users.service';
import { User } from 'src/api/public/users/domain/entities/users.entity';
import { UsersRepository } from 'src/api/public/users/infrastructure/users.repository';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'kakao-user-id',
    campusId: 1,
    departmentId: 10,
    campus: { id: 1, name: '가좌캠퍼스' } as any,
    department: {
      id: 10,
      name: '컴퓨터공학부',
      departmentEn: 'cse',
      parentDepartmentId: null,
      college: { id: 3, name: '공과대학' },
    } as any,
    ...overrides,
  } as User);

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
  });

  describe('findOne', () => {
    it('userId로 사용자를 조회한다', async () => {
      const user = makeUser();
      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('kakao-user-id');

      expect(usersRepository.findOne).toHaveBeenCalledWith('kakao-user-id');
      expect(result).toBe(user);
    });

    it('존재하지 않는 사용자면 null을 반환한다', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('unknown-id');

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('userId와 campusId, departmentId로 사용자 학과 정보를 저장한다', async () => {
      const user = makeUser({ campusId: 2, departmentId: 20 });
      usersRepository.save.mockResolvedValue(user);

      const result = await service.upsert('kakao-user-id', 2, 20);

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'kakao-user-id',
          campusId: 2,
          departmentId: 20,
        }),
      );
      expect(result).toEqual({
        userId: user.id,
        campusId: user.campusId,
        departmentId: user.departmentId,
      });
    });
  });
});
