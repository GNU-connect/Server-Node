import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { CafeteriasController } from 'src/api/public/cafeterias/cafeterias.controller';
import { CafeteriasService } from 'src/api/public/cafeterias/cafeterias.service';
import { AuthGuard } from 'src/api/public/users/guards/auth.guard';
import { CurrentUserInterceptor } from 'src/api/public/users/interceptors/current-user.interceptor';
import { UsersService } from 'src/api/public/users/users.service';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';

const CAMPUS_LIST_TEMPLATE: SkillTemplate = {
  outputs: [{ listCard: { header: { title: '캠퍼스 선택' }, items: [] } } as any],
};

const CAFETERIA_LIST_TEMPLATE: SkillTemplate = {
  outputs: [{ listCard: { header: { title: '어떤 교내 식당 정보가 알고 싶어?' }, items: [] } } as any],
};

const CAFETERIA_DIET_TEMPLATE: SkillTemplate = {
  outputs: [{ basicCard: { title: '제1학생회관', description: '점심 메뉴' } } as any],
};

const mockCafeteriasService = {
  getCafeteriaListTemplate: jest.fn(),
  getCafeteriaDietTemplate: jest.fn(),
};

const mockUsersService = {
  findOne: jest.fn(),
};

@Module({
  controllers: [CafeteriasController],
  providers: [
    { provide: CafeteriasService, useValue: mockCafeteriasService },
    { provide: UsersService, useValue: mockUsersService },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: CurrentUserInterceptor },
  ],
})
class CafeteriasTestModule {}

describe('Cafeterias (e2e)', () => {
  let app: INestApplication;

  const KAKAO_USER_ID = 'kakao-test-user-id';

  const registeredUser = {
    id: KAKAO_USER_ID,
    campus: { id: 1, name: '가좌캠퍼스' },
    department: { id: 10, name: '컴퓨터공학부' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CafeteriasTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/cafeterias', () => {
    it('campusId 없이 요청하면 캠퍼스 선택 카드를 반환한다', async () => {
      mockUsersService.findOne.mockResolvedValue(registeredUser);
      mockCafeteriasService.getCafeteriaListTemplate.mockResolvedValue(CAMPUS_LIST_TEMPLATE);

      const response = await request(app.getHttpServer())
        .post('/api/cafeterias')
        .send({
          userRequest: { user: { id: KAKAO_USER_ID } },
          action: { clientExtra: {} },
        })
        .expect(201);

      expect(response.body.version).toBe('2.0');
      expect(response.body.template).toEqual(CAMPUS_LIST_TEMPLATE);
    });

    it('사용자의 캠퍼스 ID가 자동으로 전달된다', async () => {
      mockUsersService.findOne.mockResolvedValue(registeredUser);
      mockCafeteriasService.getCafeteriaListTemplate.mockResolvedValue(CAFETERIA_LIST_TEMPLATE);

      await request(app.getHttpServer())
        .post('/api/cafeterias')
        .send({
          userRequest: { user: { id: KAKAO_USER_ID } },
          action: { clientExtra: {} },
        })
        .expect(201);

      expect(mockCafeteriasService.getCafeteriaListTemplate).toHaveBeenCalledWith(
        registeredUser.campus.id,
        undefined,
      );
    });

    it('campusId=-1을 전달하면 getCafeteriaListTemplate에 -1이 전달된다', async () => {
      mockUsersService.findOne.mockResolvedValue(registeredUser);
      mockCafeteriasService.getCafeteriaListTemplate.mockResolvedValue(CAMPUS_LIST_TEMPLATE);

      await request(app.getHttpServer())
        .post('/api/cafeterias')
        .send({
          userRequest: { user: { id: KAKAO_USER_ID } },
          action: { clientExtra: { campusId: -1 } },
        })
        .expect(201);

      expect(mockCafeteriasService.getCafeteriaListTemplate).toHaveBeenCalledWith(
        registeredUser.campus.id,
        -1,
      );
    });

    it('userId가 없으면 403을 반환한다', async () => {
      await request(app.getHttpServer())
        .post('/api/cafeterias')
        .send({ action: { clientExtra: {} } })
        .expect(403);
    });
  });

  describe('POST /api/cafeterias/diet', () => {
    it('식당 ID와 날짜/시간으로 식단을 조회한다', async () => {
      mockUsersService.findOne.mockResolvedValue(registeredUser);
      mockCafeteriasService.getCafeteriaDietTemplate.mockResolvedValue(CAFETERIA_DIET_TEMPLATE);

      const response = await request(app.getHttpServer())
        .post('/api/cafeterias/diet')
        .send({
          userRequest: { user: { id: KAKAO_USER_ID } },
          action: {
            clientExtra: { cafeteriaId: 1, date: '오늘', time: '점심' },
          },
        })
        .expect(201);

      expect(response.body.version).toBe('2.0');
      expect(response.body.template).toEqual(CAFETERIA_DIET_TEMPLATE);
    });

    it('시간 없이 요청해도 자동으로 현재 시간대가 결정된다', async () => {
      mockUsersService.findOne.mockResolvedValue(registeredUser);
      mockCafeteriasService.getCafeteriaDietTemplate.mockResolvedValue(CAFETERIA_DIET_TEMPLATE);

      await request(app.getHttpServer())
        .post('/api/cafeterias/diet')
        .send({
          userRequest: { user: { id: KAKAO_USER_ID } },
          action: {
            clientExtra: { cafeteriaId: 1, date: '오늘' },
          },
        })
        .expect(201);

      expect(mockCafeteriasService.getCafeteriaDietTemplate).toHaveBeenCalledWith(
        1,
        '오늘',
        undefined,
      );
    });
  });
});
