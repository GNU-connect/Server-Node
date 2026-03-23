import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { NoticesController } from 'src/api/public/notices/notices.controller';
import { NoticesService } from 'src/api/public/notices/notices.service';
import { AuthGuard } from 'src/api/public/users/guards/auth.guard';
import { CurrentUserInterceptor } from 'src/api/public/users/interceptors/current-user.interceptor';
import { UsersService } from 'src/api/public/users/users.service';
import { SkillTemplate } from 'src/api/common/interfaces/response/fields/template';

const AUTH_REQUIRED_TEMPLATE: SkillTemplate = {
  outputs: [{ textCard: { title: '학과 인증 필요', description: '' } } as any],
};

const UNIVERSITY_NOTICE_TEMPLATE: SkillTemplate = {
  outputs: [{ carousel: { type: 'listCard', items: [] } } as any],
};

const DEPARTMENT_NOTICE_TEMPLATE: SkillTemplate = {
  outputs: [{ carousel: { type: 'listCard', items: [] } } as any],
};

const mockNoticesService = {
  getUniversityNoticeTemplate: jest.fn().mockResolvedValue(UNIVERSITY_NOTICE_TEMPLATE),
  getDepartmentNoticeTemplate: jest.fn(),
};

const mockUsersService = {
  findOne: jest.fn(),
};

@Module({
  controllers: [NoticesController],
  providers: [
    { provide: NoticesService, useValue: mockNoticesService },
    { provide: UsersService, useValue: mockUsersService },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: CurrentUserInterceptor },
  ],
})
class NoticesTestModule {
}

describe('Notices (e2e)', () => {
  let app: INestApplication;

  const KAKAO_USER_ID = 'kakao-test-user-id';
  const KAKAO_REQUEST_BODY = {
    userRequest: { user: { id: KAKAO_USER_ID } },
    action: { clientExtra: {} },
  };

  const registeredUser = {
    id: KAKAO_USER_ID,
    campus: { id: 1, name: '가좌캠퍼스' },
    department: {
      id: 10,
      name: '컴퓨터공학부',
      departmentEn: 'cse',
      parentDepartmentId: null,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockNoticesService.getUniversityNoticeTemplate.mockResolvedValue(UNIVERSITY_NOTICE_TEMPLATE);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NoticesTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/notices/university', () => {
    it('인증된 사용자는 학교 공지사항을 조회할 수 있다', async () => {
      mockUsersService.findOne.mockResolvedValue(registeredUser);

      const response = await request(app.getHttpServer())
        .post('/api/notices/university')
        .send(KAKAO_REQUEST_BODY)
        .expect(201);

      expect(response.body.version).toBe('2.0');
      expect(response.body.template).toEqual(UNIVERSITY_NOTICE_TEMPLATE);
    });

    it('인증 실패도 카카오 스킬 오류 응답으로 변환한다', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/notices/university')
        .send({ action: { clientExtra: {} } })
        .expect(200);

      expect(response.body).toEqual({
        version: '2.0',
        template: {
          outputs: [
            {
              simpleText: {
                text: '예상치 못한 오류가 발생했어!',
              },
            },
          ],
        },
      });
    });

    it('X-USER-ID 헤더로도 인증할 수 있다', async () => {
      mockUsersService.findOne.mockResolvedValue(registeredUser);

      const response = await request(app.getHttpServer())
        .post('/api/notices/university')
        .set('X-USER-ID', KAKAO_USER_ID)
        .send({ userRequest: { user: {} }, action: { clientExtra: {} } })
        .expect(201);

      expect(response.body.version).toBe('2.0');
    });
  });

  describe('POST /api/notices/department', () => {
    it('학과 등록된 사용자는 학과 공지사항을 조회할 수 있다', async () => {
      mockUsersService.findOne.mockResolvedValue(registeredUser);
      mockNoticesService.getDepartmentNoticeTemplate.mockResolvedValue(DEPARTMENT_NOTICE_TEMPLATE);

      const response = await request(app.getHttpServer())
        .post('/api/notices/department')
        .send(KAKAO_REQUEST_BODY)
        .expect(201);

      expect(response.body.version).toBe('2.0');
      expect(response.body.template).toEqual(DEPARTMENT_NOTICE_TEMPLATE);
    });

    it('학과 미등록 사용자는 학과 등록 안내 메시지를 받는다', async () => {
      const unregisteredUser = { id: KAKAO_USER_ID, campus: null, department: null };
      mockUsersService.findOne.mockResolvedValue(unregisteredUser);
      mockNoticesService.getDepartmentNoticeTemplate.mockResolvedValue(AUTH_REQUIRED_TEMPLATE);

      const response = await request(app.getHttpServer())
        .post('/api/notices/department')
        .send(KAKAO_REQUEST_BODY)
        .expect(201);

      expect(response.body.template).toEqual(AUTH_REQUIRED_TEMPLATE);
    });

    it('DB에 없는 신규 사용자는 빈 프로필로 처리된다', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      mockNoticesService.getDepartmentNoticeTemplate.mockResolvedValue(AUTH_REQUIRED_TEMPLATE);

      await request(app.getHttpServer())
        .post('/api/notices/department')
        .send(KAKAO_REQUEST_BODY)
        .expect(201);

      expect(mockNoticesService.getDepartmentNoticeTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ id: KAKAO_USER_ID, campus: null, department: null }),
      );
    });
  });
});
