import { HttpException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AdminSession } from 'src/api/admin/auth/domain/entities/admin-session.entity';
import { AdminUser } from 'src/api/admin/auth/domain/entities/admin-user.entity';
import { AdminSessionRepository } from 'src/api/admin/auth/infrastructure/admin-session.repository';
import { AdminUserRepository } from 'src/api/admin/auth/infrastructure/admin-user.repository';
import {
  AdminAuthService,
  LOCK_DURATION_MS,
  MAX_FAILED_LOGINS,
  SESSION_RENEW_BELOW_MS,
  SESSION_TTL_MS,
  hashToken,
} from './admin-auth.service';

const PASSWORD = 'correct-horse-battery';
const NOW = new Date('2026-10-06T00:00:00.000Z');
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
// 테스트가 느려지지 않게 비용을 낮춘다. verify는 해시에 담긴 값을 쓰므로 서비스 코드는 영향이 없다.
const CHEAP_ARGON2 = { timeCost: 2, memoryCost: 1024, parallelism: 1 };

let passwordHash: string;

beforeAll(async () => {
  passwordHash = await argon2.hash(PASSWORD, CHEAP_ARGON2);
});

function createUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 1,
    email: 'admin@example.com',
    passwordHash,
    failedLoginCount: 0,
    lockedUntil: null,
    createdAt: NOW,
    ...overrides,
  };
}

function createSession(overrides: Partial<AdminSession> = {}): AdminSession {
  return {
    id: 10,
    tokenHash: 'hash',
    expiresAt: new Date(NOW.getTime() + SESSION_TTL_MS),
    createdAt: NOW,
    adminUser: createUser(),
    ...overrides,
  };
}

function setup(user: AdminUser | null = createUser()) {
  const users = {
    findByEmail: jest.fn().mockResolvedValue(user),
    incrementFailedLogins: jest.fn().mockResolvedValue(1),
    lock: jest.fn().mockResolvedValue(undefined),
    clearFailuresIfUnlocked: jest.fn().mockResolvedValue(true),
  };
  const sessions = {
    create: jest.fn().mockResolvedValue(undefined),
    findByTokenHash: jest.fn().mockResolvedValue(null),
    extend: jest.fn().mockResolvedValue(undefined),
    deleteById: jest.fn().mockResolvedValue(undefined),
    deleteByTokenHash: jest.fn().mockResolvedValue(undefined),
    deleteExpiredOf: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AdminAuthService(
    users as unknown as AdminUserRepository,
    sessions as unknown as AdminSessionRepository,
  );
  jest.spyOn(service as unknown as { now(): Date }, 'now').mockReturnValue(NOW);
  return { service, users, sessions };
}

describe('AdminAuthService.login', () => {
  it('맞는 비밀번호면 세션을 만들고 토큰 해시만 저장한다', async () => {
    const { service, users, sessions } = setup();

    const result = await service.login('admin@example.com', PASSWORD);

    expect(result.email).toBe('admin@example.com');
    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    expect(result.expiresAt).toEqual(new Date(NOW.getTime() + SESSION_TTL_MS));
    expect(sessions.create).toHaveBeenCalledWith(
      1,
      hashToken(result.token),
      new Date(NOW.getTime() + SESSION_TTL_MS),
    );
    expect(sessions.create.mock.calls[0][1]).not.toBe(result.token);
    expect(users.clearFailuresIfUnlocked).toHaveBeenCalledWith(1, NOW);
    expect(sessions.deleteExpiredOf).toHaveBeenCalledWith(1, NOW);
  });

  it('이메일의 대소문자와 앞뒤 공백은 무시한다', async () => {
    const { service, users } = setup();

    await service.login('  Admin@Example.COM ', PASSWORD);

    expect(users.findByEmail).toHaveBeenCalledWith('admin@example.com');
  });

  it('없는 이메일은 비밀번호 오류와 같은 401로 답하고 아무것도 기록하지 않는다', async () => {
    const { service, users, sessions } = setup(null);

    const error = await service.login('nobody@example.com', PASSWORD).catch(e => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.message).toBe('이메일 또는 비밀번호가 맞지 않아요.');
    expect(users.incrementFailedLogins).not.toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('틀린 비밀번호는 401이고 실패 횟수를 올린다(아직 4번이면 잠그지 않는다)', async () => {
    const { service, users, sessions } = setup();
    users.incrementFailedLogins.mockResolvedValue(MAX_FAILED_LOGINS - 1);

    const error = await service.login('admin@example.com', 'wrong').catch(e => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(error.message).toBe('이메일 또는 비밀번호가 맞지 않아요.');
    expect(users.incrementFailedLogins).toHaveBeenCalledWith(1, NOW);
    expect(users.lock).not.toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('5번째 실패에서 15분 잠근다', async () => {
    const { service, users } = setup();
    users.incrementFailedLogins.mockResolvedValue(MAX_FAILED_LOGINS);

    await expect(service.login('admin@example.com', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(users.lock).toHaveBeenCalledWith(1, new Date(NOW.getTime() + LOCK_DURATION_MS));
  });

  it('틀린 비밀번호를 검증하는 사이 다른 요청이 잠갔다면 401이 아니라 429로 답한다', async () => {
    const { service, users } = setup();
    users.incrementFailedLogins.mockResolvedValue(null);

    const error = await service.login('admin@example.com', 'wrong').catch(e => e);

    expect(error).toBeInstanceOf(HttpException);
    expect(error).not.toBeInstanceOf(UnauthorizedException);
    expect(error.getStatus()).toBe(429);
    expect(error.message).toBe('로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요.');
    expect(users.lock).not.toHaveBeenCalled();
  });

  it('맞는 비밀번호여도 검증하는 사이 잠겼다면 429이고 세션을 만들지 않는다', async () => {
    const { service, users, sessions } = setup();
    users.clearFailuresIfUnlocked.mockResolvedValue(false);

    const error = await service.login('admin@example.com', PASSWORD).catch(e => e);

    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(429);
    expect(error.message).toBe('로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요.');
    expect(sessions.deleteExpiredOf).not.toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('잠긴 동안은 맞는 비밀번호여도 429이고 세션을 만들지 않는다', async () => {
    const lockedUntil = new Date(NOW.getTime() + 10 * MINUTE);
    const { service, users, sessions } = setup(createUser({ lockedUntil }));

    const error = await service.login('admin@example.com', PASSWORD).catch(e => e);

    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(429);
    expect(error.message).toBe('로그인 시도가 너무 많아요. 10분 뒤에 다시 시도해 주세요.');
    expect(users.incrementFailedLogins).not.toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('잠금 시간이 지나면 다시 로그인된다', async () => {
    const lockedUntil = new Date(NOW.getTime() - 1);
    const { service } = setup(createUser({ lockedUntil }));

    await expect(service.login('admin@example.com', PASSWORD)).resolves.toMatchObject({
      email: 'admin@example.com',
    });
  });
});

describe('AdminAuthService.validateSession', () => {
  it('모르는 토큰이면 null', async () => {
    const { service, sessions } = setup();
    sessions.findByTokenHash.mockResolvedValue(null);

    await expect(service.validateSession('unknown')).resolves.toBeNull();
    expect(sessions.findByTokenHash).toHaveBeenCalledWith(hashToken('unknown'));
  });

  it('만료 시각이 지금이거나 지났으면 행을 지우고 null', async () => {
    const { service, sessions } = setup();
    sessions.findByTokenHash.mockResolvedValue(createSession({ expiresAt: NOW }));

    await expect(service.validateSession('t')).resolves.toBeNull();
    expect(sessions.deleteById).toHaveBeenCalledWith(10);
  });

  it('남은 시간이 23시간 이상이면 연장하지 않는다', async () => {
    const { service, sessions } = setup();
    sessions.findByTokenHash.mockResolvedValue(
      createSession({ expiresAt: new Date(NOW.getTime() + SESSION_RENEW_BELOW_MS) }),
    );

    const result = await service.validateSession('t');

    expect(result).toEqual({
      adminUser: { id: 1, email: 'admin@example.com' },
      renewedUntil: null,
    });
    expect(sessions.extend).not.toHaveBeenCalled();
  });

  it('남은 시간이 23시간 미만이면 24시간으로 연장한다', async () => {
    const { service, sessions } = setup();
    sessions.findByTokenHash.mockResolvedValue(
      createSession({ expiresAt: new Date(NOW.getTime() + 22 * HOUR) }),
    );

    const result = await service.validateSession('t');

    const renewedUntil = new Date(NOW.getTime() + SESSION_TTL_MS);
    expect(result).toEqual({
      adminUser: { id: 1, email: 'admin@example.com' },
      renewedUntil,
    });
    expect(sessions.extend).toHaveBeenCalledWith(10, renewedUntil);
  });
});

describe('AdminAuthService.logout', () => {
  it('토큰 해시로 세션을 지운다', async () => {
    const { service, sessions } = setup();

    await service.logout('some-token');

    expect(sessions.deleteByTokenHash).toHaveBeenCalledWith(hashToken('some-token'));
  });
});
