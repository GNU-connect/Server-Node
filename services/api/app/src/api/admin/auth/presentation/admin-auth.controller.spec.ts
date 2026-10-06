import {
  HttpException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { AdminAuthService } from 'src/api/admin/auth/application/admin-auth.service';
import { AdminSessionGuard } from 'src/api/admin/common/guards/admin-session.guard';
import { AdminAuthController } from './admin-auth.controller';

describe('AdminAuthController', () => {
  let app: INestApplication;
  const service = {
    login: jest.fn(),
    logout: jest.fn(),
    validateSession: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [{ provide: AdminAuthService, useValue: service }, AdminSessionGuard],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => jest.resetAllMocks());

  describe('POST /api/admin/auth/login', () => {
    it('성공하면 200과 이메일을 주고 세션 쿠키를 내린다', async () => {
      service.login.mockResolvedValue({
        token: 'tok',
        expiresAt: new Date(),
        email: 'admin@example.com',
      });

      const res = await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({ email: 'admin@example.com', password: 'pw-123456' })
        .expect(200);

      expect(res.body.data).toEqual({ email: 'admin@example.com' });
      const cookie = String(res.headers['set-cookie'][0]);
      expect(cookie).toContain('admin_session=tok');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/api/admin');
      expect(cookie).toContain('Max-Age=86400');
      expect(service.login).toHaveBeenCalledWith('admin@example.com', 'pw-123456');
    });

    it('비밀번호가 틀리면 401(서비스 오류 그대로)이고 쿠키를 내리지 않는다', async () => {
      service.login.mockRejectedValue(
        new UnauthorizedException('이메일 또는 비밀번호가 맞지 않아요.'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({ email: 'admin@example.com', password: 'wrong' })
        .expect(401);

      expect(res.body.message).toBe('이메일 또는 비밀번호가 맞지 않아요.');
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('잠긴 계정은 429', async () => {
      service.login.mockRejectedValue(new HttpException('로그인 시도가 너무 많아요.', 429));

      await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({ email: 'admin@example.com', password: 'pw-123456' })
        .expect(429);
    });

    it.each([
      ['이메일 형식이 아님', { email: 'not-an-email', password: 'pw-123456' }],
      ['비밀번호가 비어 있음', { email: 'admin@example.com', password: '' }],
      ['비밀번호가 200자를 넘음', { email: 'admin@example.com', password: 'a'.repeat(201) }],
      ['비밀번호가 문자열이 아님', { email: 'admin@example.com', password: 12345678 }],
      ['본문이 없음', {}],
    ])('%s이면 서비스에 닿기 전에 400', async (_name, body) => {
      await request(app.getHttpServer()).post('/api/admin/auth/login').send(body).expect(400);

      expect(service.login).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/admin/auth/logout', () => {
    it('세션을 지우고 쿠키를 만료시킨다', async () => {
      service.logout.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/api/admin/auth/logout')
        .set('Cookie', 'admin_session=tok')
        .expect(200);

      expect(res.body.data).toBeNull();
      expect(service.logout).toHaveBeenCalledWith('tok');
      const cookie = String(res.headers['set-cookie'][0]);
      expect(cookie).toContain('admin_session=;');
      expect(cookie).toContain('Path=/api/admin');
    });

    it('쿠키가 없어도 200', async () => {
      await request(app.getHttpServer()).post('/api/admin/auth/logout').expect(200);

      expect(service.logout).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/admin/auth/me', () => {
    it('쿠키가 없으면 401', async () => {
      await request(app.getHttpServer()).get('/api/admin/auth/me').expect(401);
    });

    it('유효한 세션이면 이메일을 준다', async () => {
      service.validateSession.mockResolvedValue({
        adminUser: { id: 1, email: 'admin@example.com' },
        renewedUntil: null,
      });

      const res = await request(app.getHttpServer())
        .get('/api/admin/auth/me')
        .set('Cookie', 'admin_session=tok')
        .expect(200);

      expect(res.body.data).toEqual({ email: 'admin@example.com' });
    });
  });
});
