import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  Transactional: () => (_target: any, _key: string, descriptor: PropertyDescriptor) => descriptor,
}));
import { UsersRepository } from 'src/type-orm/entities/users/users.repository';
import { UserMessageService } from 'src/api/public/message-templates/user-messages.service';
import { CampusesService } from 'src/api/public/campuses/campuses.service';
import { CollegesService } from 'src/api/public/colleges/colleges.service';
import { DepartmentsService } from 'src/api/public/departments/departments.service';
import { CommonMessagesService } from 'src/api/public/message-templates/common-messages.service';
import { User } from 'src/type-orm/entities/users/users.entity';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';
import { UpsertDepartmentRequestDto } from './dtos/requests/upsert-department-request.dto';

const CAMPUS_LIST_TEMPLATE: SkillTemplate = { outputs: [{ listCard: {} } as any] };
const COLLEGE_LIST_TEMPLATE: SkillTemplate = { outputs: [{ listCard: {} } as any] };
const DEPARTMENT_LIST_TEMPLATE: SkillTemplate = { outputs: [{ listCard: {} } as any] };
const PROFILE_TEMPLATE: SkillTemplate = { outputs: [{ textCard: {} } as any] };
const SIMPLE_TEXT_TEMPLATE: SkillTemplate = { outputs: [{ simpleText: {} } as any] };

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'kakao-user-id',
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
  let userMessageService: jest.Mocked<UserMessageService>;
  let campusesService: jest.Mocked<CampusesService>;
  let collegesService: jest.Mocked<CollegesService>;
  let departmentsService: jest.Mocked<DepartmentsService>;
  let commonMessagesService: jest.Mocked<CommonMessagesService>;

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
        {
          provide: UserMessageService,
          useValue: {
            createProfileMessage: jest.fn().mockReturnValue(PROFILE_TEMPLATE),
          },
        },
        {
          provide: CampusesService,
          useValue: {
            campusesListCard: jest.fn().mockResolvedValue(CAMPUS_LIST_TEMPLATE),
          },
        },
        {
          provide: CollegesService,
          useValue: {
            collegesListCard: jest.fn().mockResolvedValue(COLLEGE_LIST_TEMPLATE),
          },
        },
        {
          provide: DepartmentsService,
          useValue: {
            departmentsListCard: jest.fn().mockResolvedValue(DEPARTMENT_LIST_TEMPLATE),
          },
        },
        {
          provide: CommonMessagesService,
          useValue: {
            createSimpleText: jest.fn().mockReturnValue(SIMPLE_TEXT_TEMPLATE),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
    userMessageService = module.get(UserMessageService);
    campusesService = module.get(CampusesService);
    collegesService = module.get(CollegesService);
    departmentsService = module.get(DepartmentsService);
    commonMessagesService = module.get(CommonMessagesService);
  });

  describe('campusesListCard', () => {
    it('COLLEGE_LIST blockId로 캠퍼스 목록 카드를 반환한다', async () => {
      const result = await service.campusesListCard();

      expect(campusesService.campusesListCard).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{24}$/),
      );
      expect(result).toBe(CAMPUS_LIST_TEMPLATE);
    });
  });

  describe('collegesListCard', () => {
    it('extra와 DEPARTMENT_LIST blockId로 단과대학 목록 카드를 반환한다', async () => {
      const extra = { campusId: 1 } as any;

      const result = await service.collegesListCard(extra);

      expect(collegesService.collegesListCard).toHaveBeenCalledWith(
        extra,
        expect.stringMatching(/^[a-f0-9]{24}$/),
      );
      expect(result).toBe(COLLEGE_LIST_TEMPLATE);
    });
  });

  describe('departmentsListCard', () => {
    it('extra와 UPDATE_DEPARTMENT blockId로 학과 목록 카드를 반환한다', async () => {
      const extra = { collegeId: 3 } as any;

      const result = await service.departmentsListCard(extra);

      expect(departmentsService.departmentsListCard).toHaveBeenCalledWith(
        extra,
        expect.stringMatching(/^[a-f0-9]{24}$/),
      );
      expect(result).toBe(DEPARTMENT_LIST_TEMPLATE);
    });
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

  describe('profileTextCard', () => {
    it('user 정보를 기반으로 프로필 카드를 반환한다', () => {
      const user = makeUser();

      const result = service.profileTextCard(user);

      expect(userMessageService.createProfileMessage).toHaveBeenCalledWith(user);
      expect(result).toBe(PROFILE_TEMPLATE);
    });
  });

  describe('upsertTextCard', () => {
    it('"학과 정보를 등록했어!" 메시지를 반환한다', () => {
      service.upsertTextCard();

      expect(commonMessagesService.createSimpleText).toHaveBeenCalledWith('학과 정보를 등록했어!');
    });
  });

  describe('upsert', () => {
    it('userId와 extra로 사용자 학과 정보를 저장한다', async () => {
      const user = makeUser();
      const extra = { campusId: 1, departmentId: 10 } as UpsertDepartmentRequestDto;
      usersRepository.save.mockResolvedValue(user);

      const result = await service.upsert('kakao-user-id', extra);

      expect(usersRepository.save).toHaveBeenCalledWith('kakao-user-id', 1, 10);
      expect(result).toBe(user);
    });
  });
});
