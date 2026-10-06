import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { AdminSessionRepository } from 'src/api/admin/auth/infrastructure/admin-session.repository';
import { AdminUserRepository } from 'src/api/admin/auth/infrastructure/admin-user.repository';
import { normalizeEmail } from './normalize-email';

const HOUR_MS = 60 * 60 * 1000;
export const SESSION_TTL_MS = 24 * HOUR_MS;
/** 남은 시간이 이보다 짧을 때만 연장한다. 요청마다 DB에 쓰지 않기 위함. */
export const SESSION_RENEW_BELOW_MS = 23 * HOUR_MS;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

const INVALID_CREDENTIALS = '이메일 또는 비밀번호가 맞지 않아요.';

export interface AuthenticatedAdmin {
  id: number;
  email: string;
}

export interface LoggedInSession {
  token: string;
  expiresAt: Date;
  email: string;
}

export interface ValidatedSession {
  adminUser: AuthenticatedAdmin;
  /** 만료를 새로 늘렸으면 그 시각. 쿠키도 다시 내려줘야 한다. */
  renewedUntil: Date | null;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AdminAuthService {
  // 없는 이메일에도 해시 검증을 한 번 돌려서, 응답 시간으로 계정 존재 여부가 드러나지 않게 한다
  private readonly dummyHash = argon2.hash('timing-equalizer-password');

  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminSessionRepository: AdminSessionRepository,
  ) {}

  async login(rawEmail: string, password: string): Promise<LoggedInSession> {
    const user = await this.adminUserRepository.findByEmail(normalizeEmail(rawEmail));
    if (!user) {
      await argon2.verify(await this.dummyHash, password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const now = this.now();
    if (user.lockedUntil && user.lockedUntil > now) {
      throw new HttpException(lockedMessage(user.lockedUntil, now), HttpStatus.TOO_MANY_REQUESTS);
    }

    if (!(await argon2.verify(user.passwordHash, password))) {
      const failures = await this.adminUserRepository.incrementFailedLogins(user.id);
      if (failures >= MAX_FAILED_LOGINS) {
        await this.adminUserRepository.lock(user.id, new Date(now.getTime() + LOCK_DURATION_MS));
      }
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.adminUserRepository.clearFailures(user.id);
    await this.adminSessionRepository.deleteExpiredOf(user.id, now);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    await this.adminSessionRepository.create(user.id, hashToken(token), expiresAt);
    return { token, expiresAt, email: user.email };
  }

  async validateSession(token: string): Promise<ValidatedSession | null> {
    const session = await this.adminSessionRepository.findByTokenHash(hashToken(token));
    if (!session) return null;

    const now = this.now();
    if (session.expiresAt <= now) {
      await this.adminSessionRepository.deleteById(session.id);
      return null;
    }

    let renewedUntil: Date | null = null;
    if (session.expiresAt.getTime() - now.getTime() < SESSION_RENEW_BELOW_MS) {
      renewedUntil = new Date(now.getTime() + SESSION_TTL_MS);
      await this.adminSessionRepository.extend(session.id, renewedUntil);
    }

    return {
      adminUser: { id: session.adminUser.id, email: session.adminUser.email },
      renewedUntil,
    };
  }

  async logout(token: string): Promise<void> {
    await this.adminSessionRepository.deleteByTokenHash(hashToken(token));
  }

  /** 테스트에서 시각을 고정하려고 분리했다 */
  protected now(): Date {
    return new Date();
  }
}

function lockedMessage(lockedUntil: Date, now: Date): string {
  const minutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000);
  return `로그인 시도가 너무 많아요. ${minutes}분 뒤에 다시 시도해 주세요.`;
}
