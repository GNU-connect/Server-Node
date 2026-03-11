import { Test, TestingModule } from '@nestjs/testing';
import { CurrentUserMiddleware } from './current-user.middleware';
import { UsersService } from 'src/api/public/users/users.service';
import { User } from 'src/type-orm/entities/users/users.entity';

const makeUser = (id = 'kakao-user-id'): User =>
  ({
    id,
    campus: { id: 1, name: '가좌캠퍼스' } as any,
    department: { id: 10, name: '컴퓨터공학부' } as any,
  } as User);

const makeRequest = (overrides: {
  headers?: Record<string, string>;
  body?: Record<string, any>;
}) => ({
  headers: overrides.headers ?? {},
  body: overrides.body ?? {},
  currentUser: undefined as User | undefined,
});

describe('CurrentUserMiddleware', () => {
  let middleware: CurrentUserMiddleware;
  let usersService: jest.Mocked<Pick<UsersService, 'findOne'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrentUserMiddleware,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<CurrentUserMiddleware>(CurrentUserMiddleware);
    usersService = module.get(UsersService);
  });

  it('userId가 없으면 next()를 호출하고 currentUser를 설정하지 않는다', async () => {
    const req = makeRequest({ headers: {}, body: {} }) as any;
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(next).toHaveBeenCalled();
    expect(req.currentUser).toBeUndefined();
    expect(usersService.findOne).not.toHaveBeenCalled();
  });

  it('x-user-id 헤더로 사용자를 조회하여 currentUser에 설정한다', async () => {
    const user = makeUser('header-user');
    usersService.findOne.mockResolvedValue(user);
    const req = makeRequest({ headers: { 'x-user-id': 'header-user' } }) as any;
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(usersService.findOne).toHaveBeenCalledWith('header-user');
    expect(req.currentUser).toBe(user);
    expect(next).toHaveBeenCalled();
  });

  it('body.userRequest.user.id로 사용자를 조회하여 currentUser에 설정한다', async () => {
    const user = makeUser('kakao-user');
    usersService.findOne.mockResolvedValue(user);
    const req = makeRequest({
      body: { userRequest: { user: { id: 'kakao-user' } } },
    }) as any;
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(usersService.findOne).toHaveBeenCalledWith('kakao-user');
    expect(req.currentUser).toBe(user);
  });

  it('DB에 사용자가 없으면 빈 프로필 객체로 currentUser를 설정한다', async () => {
    usersService.findOne.mockResolvedValue(null);
    const req = makeRequest({ headers: { 'x-user-id': 'new-user' } }) as any;
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(req.currentUser).toEqual({
      id: 'new-user',
      campus: null,
      department: null,
    });
    expect(next).toHaveBeenCalled();
  });

  it('DB 조회 중 오류가 발생하면 빈 프로필 객체로 currentUser를 설정한다', async () => {
    usersService.findOne.mockRejectedValue(new Error('DB connection failed'));
    const req = makeRequest({ headers: { 'x-user-id': 'error-user' } }) as any;
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(req.currentUser).toEqual({
      id: 'error-user',
      campus: null,
      department: null,
    });
    expect(next).toHaveBeenCalled();
  });

  it('오류가 발생해도 next()는 반드시 호출된다', async () => {
    usersService.findOne.mockRejectedValue(new Error('unexpected error'));
    const req = makeRequest({ headers: { 'x-user-id': 'any-user' } }) as any;
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
