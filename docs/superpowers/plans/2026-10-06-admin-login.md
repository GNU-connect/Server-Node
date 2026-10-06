# 어드민 ID/PW 로그인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민 API 키 입력 방식을 이메일/비밀번호 로그인으로 바꾸고, 로그인 상태를 DB 세션(HttpOnly 쿠키)으로 관리한다.

**Architecture:** NestJS에 `admin/auth` 모듈을 새로 만든다. `AdminAuthService`가 인증 규칙(해시 비교, 5회 실패 15분 잠금, 24시간 슬라이딩 세션)을 모두 맡고, `AdminSessionGuard`가 기존 `AdminApiKeyGuard`를 대체한다. 어드민 웹은 앱을 열 때 `GET /auth/me`로 로그인 상태를 묻고, 쿠키는 브라우저가 알아서 보낸다.

**Tech Stack:** NestJS 9, TypeORM(Postgres), `argon2`, `cookie-parser`, Supabase 마이그레이션 / React 18 + Vite + Vitest(어드민)

**Spec:** `docs/superpowers/specs/2026-10-06-admin-login-design.md`

## Global Constraints

- 잠금: 같은 계정 연속 실패 **5회** → **15분** 잠금, 잠금이 걸리면 실패 횟수는 0으로 되돌린다.
- 세션: 만료 **24시간** 슬라이딩. 남은 시간이 **23시간 미만**일 때만 24시간으로 연장한다. DB에는 토큰의 **SHA-256 해시**만 저장한다(토큰 `randomBytes(32)` hex).
- 쿠키 `admin_session`: `HttpOnly`, `SameSite=Lax`, `Path=/api/admin`, `Max-Age=86400`, 운영(`NODE_ENV=production`)에서만 `Secure`.
- 실패 문구는 이메일 없음/비밀번호 틀림 모두 `이메일 또는 비밀번호가 맞지 않아요.`(401), 잠금은 `로그인 시도가 너무 많아요. N분 뒤에 다시 시도해 주세요.`(429).
- 이메일은 앞뒤 공백을 지우고 소문자로 바꿔 저장·조회한다.
- 비밀번호 값(`admin123!@#` 포함)은 코드·마이그레이션·문서·커밋에 쓰지 않는다. 시드는 환경변수로만 받는다.
- 어드민 화면 문구는 해요체, 이모지 없음(기존 어드민 규칙).
- 서버 import는 기존처럼 `src/...` 절대 경로를 쓴다(시드 스크립트만 예외로 상대 경로).
- 커밋 메시지는 `✨ feat:`, `🐛 fix:`, `📝 docs:`, `♻️ refactor:` 같은 기존 스타일에 한글 요약. 끝에 `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` 줄을 붙인다.
- 명령은 저장소 루트(`/Users/dongho/Desktop/Github/Server-Node`)에서 실행한다고 가정한다.

## Review Focus

1. 이메일 대소문자·앞뒤 공백: `  Admin@Example.com `으로 로그인해도 같은 계정으로 인식 (Task 2 서비스 테스트).
2. 잠금 경계: 4번째 실패는 잠그지 않고, 5번째 실패가 잠그며, 잠긴 동안은 **맞는 비밀번호여도** 429이고 세션이 만들어지지 않으며, 잠금이 풀리면 다시 로그인된다 (Task 2).
3. 이상한 쿠키: 쿠키가 없음/빈 문자열/배열·객체 값이어도 500이 아니라 401 (Task 3 가드 테스트).
4. 큰 입력: 비밀번호 200자 초과, 이메일 형식 오류는 argon2에 닿기 전에 400 (Task 4 컨트롤러 테스트).
5. `/auth/me` 확인이 네트워크 오류로 실패해도 어드민 웹이 로딩에 갇히지 않고 로그인 화면을 보여 준다 (Task 6 LoginPage 테스트).

---

### Task 1: 브랜치, 의존성, DB 마이그레이션, 엔티티

**Files:**
- Create: `supabase/migrations/20261006000000_add_admin_auth.sql`
- Create: `services/api/app/src/api/admin/auth/domain/entities/admin-user.entity.ts`
- Create: `services/api/app/src/api/admin/auth/domain/entities/admin-session.entity.ts`
- Modify: `services/api/app/package.json`, `services/api/app/pnpm-lock.yaml` (pnpm이 갱신)

**Interfaces:**
- Produces: `AdminUser { id: number; email: string; passwordHash: string; failedLoginCount: number; lockedUntil: Date | null; createdAt: Date }`, `AdminSession { id: number; tokenHash: string; expiresAt: Date; createdAt: Date; adminUser: AdminUser }` (`adminUser`는 eager 로딩)

- [ ] **Step 1: 브랜치를 만들고 문서를 커밋한다**

```bash
git switch -c feat/admin-id-pw-login
git add docs/superpowers/specs/2026-10-06-admin-login-design.md docs/superpowers/plans/2026-10-06-admin-login.md
git commit -m "📝 docs: 어드민 ID/PW 로그인 설계와 구현 계획 추가

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 2: 의존성을 설치한다**

```bash
pnpm --dir services/api/app add argon2 cookie-parser
pnpm --dir services/api/app add -D @types/cookie-parser
```

Expected: `package.json`의 dependencies에 `argon2`, `cookie-parser`, devDependencies에 `@types/cookie-parser`가 생긴다.

- [ ] **Step 3: 마이그레이션을 작성한다**

`supabase/migrations/20261006000000_add_admin_auth.sql`:

```sql
create table admin_user (
    id integer generated always as identity primary key,
    email text not null unique,
    password_hash text not null,
    failed_login_count integer not null default 0,
    locked_until timestamptz,
    created_at timestamptz not null default now()
);

create table admin_session (
    id integer generated always as identity primary key,
    admin_user_id integer not null references admin_user(id) on delete cascade,
    token_hash text not null unique,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

create index admin_session_expires_at_idx on admin_session (expires_at);

-- 정책 없이 RLS만 켠다: Supabase 공개 REST(anon 키)로는 비밀번호 해시를 읽을 수 없고,
-- API 서버는 postgres 역할로 접속해 RLS를 우회한다.
alter table admin_user enable row level security;
alter table admin_session enable row level security;
```

- [ ] **Step 4: 엔티티를 작성한다**

`services/api/app/src/api/admin/auth/domain/entities/admin-user.entity.ts`:

```ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('admin_user')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  email: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({ name: 'failed_login_count', type: 'int', default: 0 })
  failedLoginCount: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
```

`services/api/app/src/api/admin/auth/domain/entities/admin-session.entity.ts`:

```ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AdminUser } from './admin-user.entity';

@Entity('admin_session')
export class AdminSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'token_hash', type: 'text' })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => AdminUser, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser: AdminUser;
}
```

(엔티티는 `database.module.ts`의 `**/*.entity{.ts,.js}` 글롭으로 자동 등록된다.)

- [ ] **Step 5: 컴파일을 확인한다**

Run: `pnpm --dir services/api/app build`
Expected: 오류 없이 종료.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261006000000_add_admin_auth.sql services/api/app/src/api/admin/auth services/api/app/package.json services/api/app/pnpm-lock.yaml
git commit -m "✨ feat: 어드민 계정·세션 테이블과 엔티티 추가

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 레포지토리와 `AdminAuthService` (로그인·잠금·세션)

**Files:**
- Create: `services/api/app/src/api/admin/auth/application/normalize-email.ts`
- Create: `services/api/app/src/api/admin/auth/infrastructure/admin-user.repository.ts`
- Create: `services/api/app/src/api/admin/auth/infrastructure/admin-session.repository.ts`
- Create: `services/api/app/src/api/admin/auth/application/admin-auth.service.ts`
- Test: `services/api/app/src/api/admin/auth/application/admin-auth.service.spec.ts`

**Interfaces:**
- Consumes: Task 1의 `AdminUser`, `AdminSession`
- Produces:
  - `normalizeEmail(email: string): string`
  - `AdminUserRepository`: `findByEmail(email: string): Promise<AdminUser | null>`, `incrementFailedLogins(id: number): Promise<number>`(올라간 값 반환), `lock(id: number, until: Date): Promise<void>`(횟수 0 + 잠금), `clearFailures(id: number): Promise<void>`
  - `AdminSessionRepository`: `create(adminUserId: number, tokenHash: string, expiresAt: Date): Promise<void>`, `findByTokenHash(tokenHash: string): Promise<AdminSession | null>`, `extend(id: number, expiresAt: Date): Promise<void>`, `deleteById(id: number): Promise<void>`, `deleteByTokenHash(tokenHash: string): Promise<void>`, `deleteExpiredOf(adminUserId: number, now: Date): Promise<void>`
  - `AdminAuthService`: `login(email: string, password: string): Promise<LoggedInSession>`, `validateSession(token: string): Promise<ValidatedSession | null>`, `logout(token: string): Promise<void>`
  - `interface AuthenticatedAdmin { id: number; email: string }`, `interface LoggedInSession { token: string; expiresAt: Date; email: string }`, `interface ValidatedSession { adminUser: AuthenticatedAdmin; renewedUntil: Date | null }`
  - 상수 `SESSION_TTL_MS`(24시간), `SESSION_RENEW_BELOW_MS`(23시간), `MAX_FAILED_LOGINS`(5), `LOCK_DURATION_MS`(15분), 함수 `hashToken(token: string): string`

- [ ] **Step 1: 이메일 정규화 함수를 만든다**

`services/api/app/src/api/admin/auth/application/normalize-email.ts`:

```ts
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
```

- [ ] **Step 2: 실패하는 서비스 테스트를 작성한다**

`services/api/app/src/api/admin/auth/application/admin-auth.service.spec.ts`:

```ts
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
    clearFailures: jest.fn().mockResolvedValue(undefined),
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
    expect(users.clearFailures).toHaveBeenCalledWith(1);
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
    expect(users.incrementFailedLogins).toHaveBeenCalledWith(1);
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

    expect(result).toEqual({ adminUser: { id: 1, email: 'admin@example.com' }, renewedUntil: null });
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
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `pnpm --dir services/api/app exec jest src/api/admin/auth/application/admin-auth.service.spec.ts`
Expected: FAIL — `Cannot find module './admin-auth.service'`.

- [ ] **Step 4: 레포지토리를 작성한다**

`services/api/app/src/api/admin/auth/infrastructure/admin-user.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from 'src/api/admin/auth/domain/entities/admin-user.entity';

@Injectable()
export class AdminUserRepository {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  findByEmail(email: string): Promise<AdminUser | null> {
    return this.adminUserRepository.findOne({ where: { email } });
  }

  /** 한 번의 UPDATE로 올린다. 동시 요청이 와도 횟수가 유실되지 않는다. 올라간 값을 돌려준다. */
  async incrementFailedLogins(id: number): Promise<number> {
    const result = await this.adminUserRepository
      .createQueryBuilder()
      .update(AdminUser)
      .set({ failedLoginCount: () => 'failed_login_count + 1' })
      .where('id = :id', { id })
      .returning('failed_login_count')
      .execute();
    return Number(result.raw[0].failed_login_count);
  }

  async lock(id: number, until: Date): Promise<void> {
    await this.adminUserRepository.update({ id }, { failedLoginCount: 0, lockedUntil: until });
  }

  async clearFailures(id: number): Promise<void> {
    await this.adminUserRepository.update({ id }, { failedLoginCount: 0, lockedUntil: null });
  }
}
```

`services/api/app/src/api/admin/auth/infrastructure/admin-session.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSession } from 'src/api/admin/auth/domain/entities/admin-session.entity';

@Injectable()
export class AdminSessionRepository {
  constructor(
    @InjectRepository(AdminSession)
    private readonly adminSessionRepository: Repository<AdminSession>,
  ) {}

  async create(adminUserId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    const session = this.adminSessionRepository.create({
      tokenHash,
      expiresAt,
      adminUser: { id: adminUserId },
    });
    await this.adminSessionRepository.save(session);
  }

  findByTokenHash(tokenHash: string): Promise<AdminSession | null> {
    return this.adminSessionRepository.findOne({ where: { tokenHash } });
  }

  async extend(id: number, expiresAt: Date): Promise<void> {
    await this.adminSessionRepository.update({ id }, { expiresAt });
  }

  async deleteById(id: number): Promise<void> {
    await this.adminSessionRepository.delete({ id });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.adminSessionRepository.delete({ tokenHash });
  }

  async deleteExpiredOf(adminUserId: number, now: Date): Promise<void> {
    await this.adminSessionRepository
      .createQueryBuilder()
      .delete()
      .from(AdminSession)
      .where('admin_user_id = :adminUserId AND expires_at <= :now', { adminUserId, now })
      .execute();
  }
}
```

- [ ] **Step 5: 서비스를 작성한다**

`services/api/app/src/api/admin/auth/application/admin-auth.service.ts`:

```ts
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
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

Run: `pnpm --dir services/api/app exec jest src/api/admin/auth/application/admin-auth.service.spec.ts`
Expected: PASS (12 tests).

- [ ] **Step 7: Commit**

```bash
git add services/api/app/src/api/admin/auth
git commit -m "✨ feat: 어드민 로그인 서비스와 레포지토리 추가

argon2 비밀번호 검증, 5회 실패 15분 잠금, 24시간 슬라이딩 세션을 구현한다.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 세션 쿠키 헬퍼와 `AdminSessionGuard`

**Files:**
- Create: `services/api/app/src/api/admin/auth/presentation/admin-session.cookie.ts`
- Create: `services/api/app/src/api/admin/common/guards/admin-session.guard.ts`
- Test: `services/api/app/src/api/admin/auth/presentation/admin-session.cookie.spec.ts`
- Test: `services/api/app/src/api/admin/common/guards/admin-session.guard.spec.ts`

**Interfaces:**
- Consumes: Task 2의 `AdminAuthService.validateSession`, `AuthenticatedAdmin`, `SESSION_TTL_MS`
- Produces:
  - `ADMIN_SESSION_COOKIE = 'admin_session'`, `sessionCookieOptions(): CookieOptions`, `clearCookieOptions(): CookieOptions`
  - `AdminSessionGuard` (요청에 `adminUser: AuthenticatedAdmin`을 붙인다. 실패하면 `UnauthorizedException`)

- [ ] **Step 1: 실패하는 쿠키 헬퍼 테스트를 작성한다**

`services/api/app/src/api/admin/auth/presentation/admin-session.cookie.spec.ts`:

```ts
import {
  ADMIN_SESSION_COOKIE,
  clearCookieOptions,
  sessionCookieOptions,
} from './admin-session.cookie';

describe('admin session cookie', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('쿠키 이름은 admin_session', () => {
    expect(ADMIN_SESSION_COOKIE).toBe('admin_session');
  });

  it('HttpOnly, SameSite=Lax, /api/admin 경로, 24시간', () => {
    process.env.NODE_ENV = 'development';

    expect(sessionCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/api/admin',
      maxAge: 24 * 60 * 60 * 1000,
    });
  });

  it('운영에서만 Secure', () => {
    process.env.NODE_ENV = 'production';

    expect(sessionCookieOptions().secure).toBe(true);
  });

  it('쿠키를 지울 때는 경로 등은 같고 maxAge만 뺀다', () => {
    process.env.NODE_ENV = 'development';

    expect(clearCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/api/admin',
    });
  });
});
```

- [ ] **Step 2: 실패하는 가드 테스트를 작성한다**

`services/api/app/src/api/admin/common/guards/admin-session.guard.spec.ts`:

```ts
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from 'src/api/admin/auth/application/admin-auth.service';
import { AdminSessionGuard } from './admin-session.guard';

function createContext(cookies: unknown) {
  const request: Record<string, unknown> = { cookies };
  const cookie = jest.fn();
  const context = {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({ cookie }) }),
  } as unknown as ExecutionContext;
  return { context, request, cookie };
}

function createGuard(validateSession: jest.Mock) {
  return new AdminSessionGuard({ validateSession } as unknown as AdminAuthService);
}

describe('AdminSessionGuard', () => {
  it.each([
    ['쿠키 객체가 없음', undefined],
    ['쿠키가 비어 있음', {}],
    ['빈 문자열', { admin_session: '' }],
    ['배열 값', { admin_session: ['a', 'b'] }],
    ['객체 값', { admin_session: { a: 1 } }],
  ])('%s이면 서비스에 묻지 않고 401', async (_name, cookies) => {
    const validateSession = jest.fn();
    const { context } = createContext(cookies);

    await expect(createGuard(validateSession).canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(validateSession).not.toHaveBeenCalled();
  });

  it('세션이 없거나 만료됐으면 401', async () => {
    const validateSession = jest.fn().mockResolvedValue(null);
    const { context } = createContext({ admin_session: 'token' });

    await expect(createGuard(validateSession).canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(validateSession).toHaveBeenCalledWith('token');
  });

  it('유효하면 통과시키고 요청에 adminUser를 붙인다(연장이 없으면 쿠키를 다시 내리지 않는다)', async () => {
    const adminUser = { id: 1, email: 'admin@example.com' };
    const validateSession = jest.fn().mockResolvedValue({ adminUser, renewedUntil: null });
    const { context, request, cookie } = createContext({ admin_session: 'token' });

    await expect(createGuard(validateSession).canActivate(context)).resolves.toBe(true);

    expect(request.adminUser).toEqual(adminUser);
    expect(cookie).not.toHaveBeenCalled();
  });

  it('세션이 연장됐으면 쿠키 만료도 24시간으로 다시 내린다', async () => {
    const validateSession = jest.fn().mockResolvedValue({
      adminUser: { id: 1, email: 'admin@example.com' },
      renewedUntil: new Date(),
    });
    const { context, cookie } = createContext({ admin_session: 'token' });

    await createGuard(validateSession).canActivate(context);

    expect(cookie).toHaveBeenCalledWith(
      'admin_session',
      'token',
      expect.objectContaining({ httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }),
    );
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `pnpm --dir services/api/app exec jest src/api/admin/auth/presentation src/api/admin/common/guards/admin-session.guard.spec.ts`
Expected: FAIL — 모듈을 찾을 수 없음.

- [ ] **Step 4: 쿠키 헬퍼를 작성한다**

`services/api/app/src/api/admin/auth/presentation/admin-session.cookie.ts`:

```ts
import { CookieOptions } from 'express';
import { SESSION_TTL_MS } from 'src/api/admin/auth/application/admin-auth.service';

export const ADMIN_SESSION_COOKIE = 'admin_session';

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    // 로컬 개발은 http라서 운영에서만 Secure를 켠다
    secure: process.env.NODE_ENV === 'production',
    path: '/api/admin',
    maxAge: SESSION_TTL_MS,
  };
}

/** clearCookie는 설정할 때와 같은 경로·속성이어야 지워진다 */
export function clearCookieOptions(): CookieOptions {
  const options = sessionCookieOptions();
  delete options.maxAge;
  return options;
}
```

- [ ] **Step 5: 가드를 작성한다**

`services/api/app/src/api/admin/common/guards/admin-session.guard.ts`:

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  AdminAuthService,
  AuthenticatedAdmin,
} from 'src/api/admin/auth/application/admin-auth.service';
import {
  ADMIN_SESSION_COOKIE,
  sessionCookieOptions,
} from 'src/api/admin/auth/presentation/admin-session.cookie';

export type AdminRequest = Request & { adminUser?: AuthenticatedAdmin };

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<AdminRequest>();

    const token: unknown = request.cookies?.[ADMIN_SESSION_COOKIE];
    if (typeof token !== 'string' || token === '') throw new UnauthorizedException();

    const session = await this.adminAuthService.validateSession(token);
    if (!session) throw new UnauthorizedException();

    request.adminUser = session.adminUser;
    if (session.renewedUntil) {
      http.getResponse<Response>().cookie(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    }
    return true;
  }
}
```

- [ ] **Step 6: 테스트가 통과하는지 확인한다**

Run: `pnpm --dir services/api/app exec jest src/api/admin/auth/presentation src/api/admin/common/guards/admin-session.guard.spec.ts`
Expected: PASS (4 + 8 tests).

- [ ] **Step 7: Commit**

```bash
git add services/api/app/src/api/admin/auth/presentation services/api/app/src/api/admin/common/guards/admin-session.guard.ts services/api/app/src/api/admin/common/guards/admin-session.guard.spec.ts
git commit -m "✨ feat: 어드민 세션 쿠키 헬퍼와 AdminSessionGuard 추가

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 컨트롤러, 모듈 연결, 기존 API 키 가드 제거

**Files:**
- Create: `services/api/app/src/api/admin/auth/presentation/dtos/requests/login-request.dto.ts`
- Create: `services/api/app/src/api/admin/auth/presentation/admin-auth.controller.ts`
- Create: `services/api/app/src/api/admin/auth/admin-auth.module.ts`
- Test: `services/api/app/src/api/admin/auth/presentation/admin-auth.controller.spec.ts`
- Test: `services/api/app/src/api/admin/scrape-runs/presentation/scrape-runs.controller.spec.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/presentation/scrape-runs.controller.ts` (가드 교체)
- Modify: `services/api/app/src/api/admin/scrape-runs/scrape-runs.module.ts`
- Modify: `services/api/app/src/app.module.ts`
- Modify: `services/api/app/src/main.ts`
- Delete: `services/api/app/src/api/admin/common/guards/admin-api-key.guard.ts`, `admin-api-key.guard.spec.ts`

**Interfaces:**
- Consumes: Task 2의 `AdminAuthService`, 레포지토리, Task 3의 `AdminSessionGuard`, 쿠키 헬퍼
- Produces: `AdminAuthModule`(exports `AdminAuthService`, `AdminSessionGuard`), 엔드포인트 `POST /api/admin/auth/login`(200, `{ data: { email } }`), `POST /api/admin/auth/logout`(200, `{ data: null }`), `GET /api/admin/auth/me`(200, `{ data: { email } }`)

- [ ] **Step 1: 실패하는 컨트롤러 테스트를 작성한다**

`services/api/app/src/api/admin/auth/presentation/admin-auth.controller.spec.ts`:

```ts
import { HttpException, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
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
```

`services/api/app/src/api/admin/scrape-runs/presentation/scrape-runs.controller.spec.ts` (가드 교체 회귀 방지):

```ts
import { AdminSessionGuard } from 'src/api/admin/common/guards/admin-session.guard';
import { ScrapeRunsController } from './scrape-runs.controller';

describe('ScrapeRunsController', () => {
  it('어드민 세션 가드로 보호된다', () => {
    const guards: unknown[] = Reflect.getMetadata('__guards__', ScrapeRunsController) ?? [];

    expect(guards).toContain(AdminSessionGuard);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `pnpm --dir services/api/app exec jest src/api/admin/auth/presentation/admin-auth.controller.spec.ts src/api/admin/scrape-runs/presentation/scrape-runs.controller.spec.ts`
Expected: FAIL — `admin-auth.controller` 모듈 없음, scrape-runs는 가드 불일치.

- [ ] **Step 3: DTO와 컨트롤러를 작성한다**

`services/api/app/src/api/admin/auth/presentation/dtos/requests/login-request.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  // argon2에 아주 긴 입력이 닿지 않게 상한을 둔다
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password: string;
}
```

`services/api/app/src/api/admin/auth/presentation/admin-auth.controller.ts`:

```ts
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AdminAuthService } from 'src/api/admin/auth/application/admin-auth.service';
import { AdminRequest, AdminSessionGuard } from 'src/api/admin/common/guards/admin-session.guard';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import {
  ADMIN_SESSION_COOKIE,
  clearCookieOptions,
  sessionCookieOptions,
} from './admin-session.cookie';
import { LoginRequestDto } from './dtos/requests/login-request.dto';

@ApiTags('admin')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: '로그인 성공. admin_session 쿠키를 내려준다' })
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NativeResponseDto<{ email: string }>> {
    const session = await this.adminAuthService.login(body.email, body.password);
    res.cookie(ADMIN_SESSION_COOKIE, session.token, sessionCookieOptions());
    return new NativeResponseDto({ email: session.email });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NativeResponseDto<null>> {
    const token: unknown = req.cookies?.[ADMIN_SESSION_COOKIE];
    if (typeof token === 'string' && token !== '') await this.adminAuthService.logout(token);
    res.clearCookie(ADMIN_SESSION_COOKIE, clearCookieOptions());
    return new NativeResponseDto(null);
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  @ApiCookieAuth()
  me(@Req() req: AdminRequest): NativeResponseDto<{ email: string }> {
    return new NativeResponseDto({ email: req.adminUser.email });
  }
}
```

- [ ] **Step 4: 모듈을 만들고 연결한다**

`services/api/app/src/api/admin/auth/admin-auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthService } from 'src/api/admin/auth/application/admin-auth.service';
import { AdminSession } from 'src/api/admin/auth/domain/entities/admin-session.entity';
import { AdminUser } from 'src/api/admin/auth/domain/entities/admin-user.entity';
import { AdminSessionRepository } from 'src/api/admin/auth/infrastructure/admin-session.repository';
import { AdminUserRepository } from 'src/api/admin/auth/infrastructure/admin-user.repository';
import { AdminAuthController } from 'src/api/admin/auth/presentation/admin-auth.controller';
import { AdminSessionGuard } from 'src/api/admin/common/guards/admin-session.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser, AdminSession])],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminUserRepository, AdminSessionRepository, AdminSessionGuard],
  exports: [AdminAuthService, AdminSessionGuard],
})
export class AdminAuthModule {}
```

`services/api/app/src/app.module.ts`: import 한 줄과 `imports` 배열 마지막(`ScrapeRunsModule,` 다음)에 추가.

```ts
import { AdminAuthModule } from './api/admin/auth/admin-auth.module';
// ...
    ScrapeRunsModule,
    AdminAuthModule,
```

`services/api/app/src/api/admin/scrape-runs/scrape-runs.module.ts`: `AdminApiKeyGuard` import와 providers 항목을 지우고 `AdminAuthModule`을 import한다.

```ts
import { AdminAuthModule } from 'src/api/admin/auth/admin-auth.module';
// (AdminApiKeyGuard import 삭제)

@Module({
  imports: [TypeOrmModule.forFeature([ScrapeRun, Cafeteria, NoticeCategory]), AdminAuthModule],
  controllers: [ScrapeRunsController],
  providers: [ScrapeRunsService, ScrapeRunRepository, ScrapeTargetsRepository],
})
export class ScrapeRunsModule {}
```

`services/api/app/src/api/admin/scrape-runs/presentation/scrape-runs.controller.ts`: import 두 줄과 데코레이터 세 곳을 바꾼다.

```ts
// 변경 전
import { ApiAcceptedResponse, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminApiKeyGuard } from 'src/api/admin/common/guards/admin-api-key.guard';
// 변경 후
import { ApiAcceptedResponse, ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminSessionGuard } from 'src/api/admin/common/guards/admin-session.guard';

// 변경 전
@ApiSecurity('X-ADMIN-API-KEY')
@Controller('admin')
@UseGuards(AdminApiKeyGuard)
// 변경 후
@ApiCookieAuth()
@Controller('admin')
@UseGuards(AdminSessionGuard)
```

`services/api/app/src/main.ts`: import와 미들웨어를 추가하고, Swagger의 `X-ADMIN-API-KEY` 블록을 쿠키 인증으로 바꾼다.

```ts
import * as cookieParser from 'cookie-parser';
// ...
  app.useGlobalPipes(/* 기존 그대로 */);
  app.use(cookieParser());
// ...
// 변경 전
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-ADMIN-API-KEY',
        in: 'header',
        description: 'admin API 키 (ADMIN_API_KEY 환경변수)',
      },
      'X-ADMIN-API-KEY',
    )
// 변경 후
    .addCookieAuth('admin_session')
```

- [ ] **Step 5: 기존 키 가드를 삭제한다**

```bash
git rm services/api/app/src/api/admin/common/guards/admin-api-key.guard.ts services/api/app/src/api/admin/common/guards/admin-api-key.guard.spec.ts
grep -rn "AdminApiKeyGuard\|ADMIN_API_KEY\|x-admin-api-key" services --include=*.ts --exclude-dir=node_modules --exclude-dir=dist
```

Expected: grep 결과 없음.

- [ ] **Step 6: 전체 서버 테스트, 린트, 빌드를 돌린다**

Run:
```bash
pnpm --dir services/api/app exec jest --runInBand
pnpm --dir services/api/app lint:check
pnpm --dir services/api/app build
```
Expected: 모두 통과. (lint가 포맷 오류를 내면 `pnpm --dir services/api/app exec prettier --write <파일>`로 고친다.)

- [ ] **Step 7: Commit**

```bash
git add -A services/api/app
git commit -m "✨ feat: 어드민 로그인 API 추가하고 API 키 가드를 세션 가드로 교체

POST /api/admin/auth/login, logout, GET /me를 추가하고 ADMIN_API_KEY 검사를 제거한다.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 계정 시드 스크립트

**Files:**
- Create: `services/api/app/src/scripts/seed-admin.ts`
- Test: `services/api/app/src/scripts/seed-admin.spec.ts`
- Modify: `services/api/app/package.json` (scripts)

**Interfaces:**
- Consumes: Task 2의 `normalizeEmail`(상대 경로로 import)
- Produces: `readSeedInput(env: NodeJS.ProcessEnv): { email: string; password: string }`, 실행 파일 `dist/scripts/seed-admin.js`

- [ ] **Step 1: 실패하는 테스트를 작성한다**

`services/api/app/src/scripts/seed-admin.spec.ts`:

```ts
import { readSeedInput } from './seed-admin';

describe('readSeedInput', () => {
  it('이메일은 공백을 지우고 소문자로 바꾼다', () => {
    expect(
      readSeedInput({ ADMIN_SEED_EMAIL: '  Admin@Example.com ', ADMIN_SEED_PASSWORD: 'long-enough-pw' }),
    ).toEqual({ email: 'admin@example.com', password: 'long-enough-pw' });
  });

  it.each([
    ['이메일이 없음', { ADMIN_SEED_PASSWORD: 'long-enough-pw' }],
    ['비밀번호가 없음', { ADMIN_SEED_EMAIL: 'admin@example.com' }],
    ['둘 다 없음', {}],
    ['이메일이 공백뿐', { ADMIN_SEED_EMAIL: '   ', ADMIN_SEED_PASSWORD: 'long-enough-pw' }],
  ])('%s이면 오류', (_name, env) => {
    expect(() => readSeedInput(env)).toThrow('ADMIN_SEED_EMAIL과 ADMIN_SEED_PASSWORD를 모두 설정해 주세요.');
  });

  it('비밀번호가 8자 미만이면 오류', () => {
    expect(() =>
      readSeedInput({ ADMIN_SEED_EMAIL: 'admin@example.com', ADMIN_SEED_PASSWORD: 'short' }),
    ).toThrow('비밀번호는 8자 이상이어야 해요.');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `pnpm --dir services/api/app exec jest src/scripts/seed-admin.spec.ts`
Expected: FAIL — `Cannot find module './seed-admin'`.

- [ ] **Step 3: 스크립트를 작성한다**

`services/api/app/src/scripts/seed-admin.ts`:

```ts
import * as argon2 from 'argon2';
import { Client } from 'pg';
// 빌드 결과(dist)를 node로 바로 실행하는 스크립트라 src 별칭 대신 상대 경로를 쓴다
import { normalizeEmail } from '../api/admin/auth/application/normalize-email';

const MIN_PASSWORD_LENGTH = 8;

export interface SeedInput {
  email: string;
  password: string;
}

export function readSeedInput(env: NodeJS.ProcessEnv): SeedInput {
  const email = normalizeEmail(env.ADMIN_SEED_EMAIL ?? '');
  const password = env.ADMIN_SEED_PASSWORD ?? '';
  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL과 ADMIN_SEED_PASSWORD를 모두 설정해 주세요.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`);
  }
  return { email, password };
}

async function main(): Promise<void> {
  const { email, password } = readSeedInput(process.env);
  const passwordHash = await argon2.hash(password);

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  await client.connect();
  try {
    const { rows } = await client.query<{ id: number }>(
      `insert into admin_user (email, password_hash) values ($1, $2)
       on conflict (email) do update
         set password_hash = excluded.password_hash, failed_login_count = 0, locked_until = null
       returning id`,
      [email, passwordHash],
    );
    // 비밀번호를 바꿨으니 이전 로그인 세션은 모두 끊는다
    await client.query('delete from admin_session where admin_user_id = $1', [rows[0].id]);
    console.log(`어드민 계정을 저장했어요: ${email}`);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
```

`services/api/app/package.json`의 `scripts`에 `"start:prod"` 아래 줄을 추가한다.

```json
    "seed:admin": "node dist/scripts/seed-admin.js",
```

- [ ] **Step 4: 테스트와 빌드를 확인한다**

Run:
```bash
pnpm --dir services/api/app exec jest src/scripts/seed-admin.spec.ts
pnpm --dir services/api/app build && ls services/api/app/dist/scripts/seed-admin.js
```
Expected: 테스트 PASS(6 tests), `dist/scripts/seed-admin.js`가 출력된다.

- [ ] **Step 5: Commit**

```bash
git add services/api/app/src/scripts services/api/app/package.json
git commit -m "✨ feat: 어드민 계정 시드 스크립트 추가

환경변수로 받은 이메일/비밀번호를 argon2 해시로 upsert하고 기존 세션을 끊는다.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 어드민 웹 — 이메일/비밀번호 로그인과 쿠키 세션

**Files:**
- Modify: `admin/src/api/types.ts` (끝에 `AdminUser` 추가)
- Modify: `admin/src/api/errors.ts` (주석 한 줄)
- Modify (전체 교체): `admin/src/api/adminClient.ts`, `admin/src/auth/AuthContext.tsx`, `admin/src/auth/RequireAuth.tsx`, `admin/src/pages/LoginPage.tsx`, `admin/src/test/renderApp.tsx`, `admin/src/pages/LoginPage.test.tsx`
- Modify (부분): `admin/src/pages/ScrapersPage.tsx`, `admin/src/pages/ScrapeRunsPage.tsx`, `admin/src/features/scrapers/RunDetailPanel.tsx`, `admin/src/api/adminClient.test.ts`, `admin/src/layout/AppLayout.test.tsx`, `admin/src/pages/ScrapersPage.test.tsx`, `admin/src/pages/ScrapeRunsPage.test.tsx`
- Delete: `admin/src/auth/keyStorage.ts`

**Interfaces:**
- Consumes: Task 4의 엔드포인트 `GET /api/admin/auth/me`, `POST /api/admin/auth/login`(본문 `{ email, password }`), `POST /api/admin/auth/logout`, 응답 `{ data: { email } }`
- Produces: `adminClient`의 `getMe(): Promise<AdminUser>`, `login(email, password): Promise<AdminUser>`, `logout(): Promise<null>`, 기존 함수의 `apiKey` 인자 제거(`getScraperStatuses()`, `listScrapeRuns(params?)`, `getScrapeRun(id)`, `requestScrapeRun(type, target?)`), `useAuth(): { user: AdminUser | null; loading: boolean; login(email, password): Promise<void>; logout(): void }`, 테스트 헬퍼 `renderApp(path, { loggedIn?: boolean; meFails?: boolean })`

- [ ] **Step 1: 타입과 에러 주석을 고친다**

`admin/src/api/types.ts` 맨 끝에 추가:

```ts
export interface AdminUser {
  email: string;
}
```

`admin/src/api/errors.ts`:

```ts
// 변경 전
/** 401/403. 키가 없거나 틀림 */
// 변경 후
/** 401/403. 로그인하지 않았거나 세션이 만료됨 */
```

- [ ] **Step 2: 테스트 헬퍼를 바꾼다**

`admin/src/test/renderApp.tsx` 전체:

```tsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes, ROUTER_FUTURE } from '../App';
import { AuthProvider } from '../auth/AuthContext';
import { jsonResponse, ok } from './http';

interface RenderAppOptions {
  /** 앱을 열 때 /auth/me가 성공한다 */
  loggedIn?: boolean;
  /** 앱을 열 때 /auth/me가 네트워크 오류로 실패한다 */
  meFails?: boolean;
}

/**
 * /auth/me 확인만 가로채고, 나머지 요청은 테스트가 먼저 심어 둔 fetch로 넘긴다.
 * 그래서 각 테스트의 fetchMock 호출 목록에는 로그인 확인 요청이 섞이지 않는다.
 */
export function renderApp(path: string, { loggedIn = false, meFails = false }: RenderAppOptions = {}) {
  const underlying = globalThis.fetch;
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === '/api/admin/auth/me') {
      if (meFails) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve(
        loggedIn
          ? ok({ email: 'admin@example.com' })
          : jsonResponse(401, { statusCode: 401, message: 'Unauthorized' }),
      );
    }
    return underlying(input, init);
  });
  return render(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
```

- [ ] **Step 3: 실패하는 LoginPage 테스트를 작성한다**

`admin/src/pages/LoginPage.test.tsx` 전체:

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { allStatuses } from '../test/fixtures';
import { callsTo, jsonResponse, ok, routeFetch } from '../test/http';
import { renderApp } from '../test/renderApp';

const EMAIL = 'admin@example.com';
const PASSWORD = 'pw-123456';

function adminRoutes() {
  return routeFetch({
    'POST /api/admin/auth/login': (_url, init) => {
      const body = JSON.parse(String(init?.body));
      return body.email === EMAIL && body.password === PASSWORD
        ? ok({ email: body.email })
        : jsonResponse(401, { statusCode: 401, message: '이메일 또는 비밀번호가 맞지 않아요.' });
    },
    'GET /api/admin/scrapers': () => ok(allStatuses()),
    'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
  });
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('이메일'), email);
  await user.type(screen.getByLabelText('비밀번호'), password);
  await user.click(screen.getByRole('button', { name: '들어가기' }));
}

describe('로그인', () => {
  it('로그인하지 않았으면 어느 경로든 로그인 화면을 보여 준다', async () => {
    adminRoutes();
    renderApp('/scrapers');

    expect(await screen.findByRole('heading', { name: '운영자 확인이 필요해요' })).toBeInTheDocument();
  });

  it('이메일이나 비밀번호를 비워 두면 들어가기 버튼이 눌리지 않는다', async () => {
    adminRoutes();
    const user = userEvent.setup();
    renderApp('/login');

    expect(await screen.findByRole('button', { name: '들어가기' })).toBeDisabled();
    await user.type(screen.getByLabelText('이메일'), EMAIL);
    expect(screen.getByRole('button', { name: '들어가기' })).toBeDisabled();
    await user.type(screen.getByLabelText('비밀번호'), PASSWORD);
    expect(screen.getByRole('button', { name: '들어가기' })).toBeEnabled();
  });

  it('맞는 계정이면 수집 상태 화면으로 가고, 키 헤더 없이 JSON 본문으로 보낸다', async () => {
    const fetchMock = adminRoutes();
    renderApp('/login');

    await fillAndSubmit(EMAIL, PASSWORD);

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST', '/api/admin/auth/login');
    expect(JSON.parse(String(init.body))).toEqual({ email: EMAIL, password: PASSWORD });
  });

  it('이메일 앞뒤 공백은 지우고 보낸다', async () => {
    const fetchMock = adminRoutes();
    renderApp('/login');

    await fillAndSubmit(`  ${EMAIL} `, PASSWORD);

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST', '/api/admin/auth/login');
    expect(JSON.parse(String(init.body)).email).toBe(EMAIL);
  });

  it('틀린 계정이면 서버가 준 문구를 보여 주고 다시 시도할 수 있다', async () => {
    adminRoutes();
    renderApp('/login');

    await fillAndSubmit(EMAIL, 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 맞지 않아요.');
    expect(screen.getByRole('button', { name: '들어가기' })).toBeEnabled();
  });

  it('잠긴 계정이면 429 문구를 그대로 보여 준다', async () => {
    routeFetch({
      'POST /api/admin/auth/login': () =>
        jsonResponse(429, {
          statusCode: 429,
          message: '로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요.',
        }),
    });
    renderApp('/login');

    await fillAndSubmit(EMAIL, PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent('15분 뒤에 다시 시도해 주세요.');
  });

  it('서버에 닿지 못하면 연결 안내를 보여 준다', async () => {
    routeFetch({}).mockRejectedValue(new TypeError('Failed to fetch'));
    renderApp('/login');

    await fillAndSubmit(EMAIL, PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent('서버에 연결하지 못했어요.');
  });

  it('로그인 후에는 원래 가려던 화면으로 돌아간다', async () => {
    adminRoutes();
    renderApp('/scrape-runs');

    await fillAndSubmit(EMAIL, PASSWORD);

    expect(await screen.findByRole('heading', { name: '실행 기록', level: 1 })).toBeInTheDocument();
  });

  it('비밀번호 보기 버튼으로 입력값을 보이거나 숨긴다', async () => {
    adminRoutes();
    const user = userEvent.setup();
    renderApp('/login');
    const input = await screen.findByLabelText('비밀번호');

    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: '비밀번호 숨기기' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('이미 로그인했으면 로그인 화면 대신 수집 상태로 보낸다', async () => {
    adminRoutes();
    renderApp('/login', { loggedIn: true });

    expect(await screen.findByRole('heading', { name: '수집 상태', level: 1 })).toBeInTheDocument();
  });

  it('로그인 상태 확인이 네트워크 오류로 실패해도 로그인 화면을 보여 준다', async () => {
    adminRoutes();
    renderApp('/scrapers', { meFails: true });

    expect(await screen.findByRole('heading', { name: '운영자 확인이 필요해요' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: 테스트가 실패하는지 확인한다**

Run: `pnpm --dir admin exec vitest run src/pages/LoginPage.test.tsx`
Expected: FAIL (현재 화면에 `이메일` 라벨이 없음, `AuthContext`가 `user`를 주지 않음).

- [ ] **Step 5: API 클라이언트를 바꾼다**

`admin/src/api/adminClient.ts` 전체:

```ts
import { ApiError, ConflictError, NetworkError, UnauthorizedError } from './errors';
import type {
  AdminUser,
  ListScrapeRunsParams,
  ScrapeRun,
  ScrapeRunPage,
  ScrapeRunType,
  ScraperStatus,
} from './types';

const BASE_PATH = '/api/admin';

export function getMe(): Promise<AdminUser> {
  return request('/auth/me');
}

export function login(email: string, password: string): Promise<AdminUser> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function logout(): Promise<null> {
  return request('/auth/logout', { method: 'POST' });
}

export function getScraperStatuses(): Promise<ScraperStatus[]> {
  return request('/scrapers');
}

export function listScrapeRuns(params: ListScrapeRunsParams = {}): Promise<ScrapeRunPage> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const qs = query.toString();
  return request(`/scrape-runs${qs ? `?${qs}` : ''}`);
}

export function getScrapeRun(id: number): Promise<ScrapeRun> {
  return request(`/scrape-runs/${id}`);
}

export async function requestScrapeRun(type: ScrapeRunType, target?: string): Promise<ScrapeRun[]> {
  const body = target === undefined ? { type } : { type, target };
  const data = await request<{ runs: ScrapeRun[] }>('/scrape-runs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.runs;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    // 세션 쿠키는 브라우저가 같은 출처 요청에 알아서 붙인다
    response = await fetch(`${BASE_PATH}${path}`, { ...init, headers, credentials: 'same-origin' });
  } catch {
    throw new NetworkError();
  }

  const body = await readJson(response);
  if (!response.ok) throw toError(response.status, body);
  return (body as { data: T }).data;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toError(status: number, body: unknown): ApiError {
  const message = errorMessage(status, body);
  if (status === 401 || status === 403) return new UnauthorizedError(status, message);
  if (status === 409) return new ConflictError(message);
  return new ApiError(status, message);
}

function errorMessage(status: number, body: unknown): string {
  const raw = body && typeof body === 'object' ? (body as { message?: unknown }).message : undefined;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string' && raw) return raw;
  return `HTTP ${status}`;
}
```

- [ ] **Step 6: 인증 컨텍스트와 보호 라우트를 바꾼다**

`admin/src/auth/AuthContext.tsx` 전체:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, login as loginRequest, logout as logoutRequest } from '../api/adminClient';
import type { AdminUser } from '../api/types';

interface AuthValue {
  user: AdminUser | null;
  /** 앱을 열 때 서버에 로그인 상태를 묻는 동안 true */
  loading: boolean;
  /** 틀리면 UnauthorizedError, 잠겼으면 ApiError(429)를 던진다. */
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then(me => {
        if (!cancelled) setUser(me);
      })
      // 401이든 네트워크 오류든 로그인 화면으로 보낸다(로딩에 갇히지 않게)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await loginRequest(email.trim(), password));
  }, []);

  const logout = useCallback(() => {
    // 화면은 바로 로그아웃시키고, 서버 세션 삭제는 실패해도 넘어간다
    setUser(null);
    logoutRequest().catch(() => {});
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있어요.');
  return value;
}
```

`admin/src/auth/RequireAuth.tsx` 전체:

```tsx
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 7: 로그인 화면을 바꾼다**

`admin/src/pages/LoginPage.tsx` 전체:

```tsx
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, errorText } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Icon, Notice, TextField } from '../design/components';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/scrapers';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={from} replace />;

  const canSubmit = email.trim() !== '' && password !== '' && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // 서버가 계정 오류(401)와 잠금(429)을 이미 해요체 문장으로 알려 준다
      setError(err instanceof ApiError ? err.message : errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="ad-login">
      <Card as="main">
        <div className="ad-login-head">
          <img className="ad-login-icon" src="/jinu-app-icon.webp" alt="" />
          <h1 className="ad-login-title">운영자 확인이 필요해요</h1>
          <p className="ad-login-desc">운영자 계정으로 로그인해 주세요.</p>
        </div>
        <form className="ad-login-form" onSubmit={handleSubmit}>
          <TextField
            id="admin-email"
            label="이메일"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            id="admin-password"
            label="비밀번호"
            type={revealed ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            trailing={
              <button
                type="button"
                className="ad-icon-btn"
                aria-label={revealed ? '비밀번호 숨기기' : '비밀번호 보기'}
                onClick={() => setRevealed(r => !r)}
              >
                <Icon name={revealed ? 'eye-off' : 'eye'} />
              </button>
            }
          />
          {error && <Notice tone="danger">{error}</Notice>}
          <Button type="submit" size="lg" block disabled={!canSubmit}>
            {submitting ? '확인하는 중…' : '들어가기'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 8: 화면의 키 의존을 걷어낸다**

```bash
git rm admin/src/auth/keyStorage.ts
cd admin
perl -0pi -e 's/getScraperStatuses\(apiKey\)/getScraperStatuses()/g; s/listScrapeRuns\(apiKey, /listScrapeRuns(/g; s/requestScrapeRun\(apiKey, /requestScrapeRun(/g; s/getScrapeRun\(apiKey, /getScrapeRun(/g; s/\[apiKey, /[/g; s/  const apiKey = useApiKey\(\);\n//g; s/import \{ useApiKey, useAuth \}/import { useAuth }/g' \
  src/pages/ScrapersPage.tsx src/pages/ScrapeRunsPage.tsx src/features/scrapers/RunDetailPanel.tsx
cd ..
grep -rn "apiKey\|useApiKey" admin/src --include=*.ts --include=*.tsx | grep -v "\.test\."
```

Expected: grep 결과 없음. (`listScrapeRuns`의 두 번째 호출처럼 `{`로 줄이 이어지는 부분도 치환된다.)

- [ ] **Step 9: 기존 테스트를 새 방식에 맞춘다**

```bash
grep -rl "apiKey: 'k'" admin/src | xargs sed -i '' "s/{ apiKey: 'k' }/{ loggedIn: true }/g"
sed -i '' -E "s/(getScraperStatuses|getScrapeRun|listScrapeRuns|requestScrapeRun)\('(k|secret)', /\1(/g; s/(getScraperStatuses|listScrapeRuns)\('(k|secret)'\)/\1()/g" admin/src/api/adminClient.test.ts
grep -n "'k'\|'secret'\|x-admin-api-key\|sessionStorage" admin/src/api/adminClient.test.ts admin/src/layout/AppLayout.test.tsx admin/src/pages/ScrapersPage.test.tsx admin/src/pages/ScrapeRunsPage.test.tsx
```

grep에 남은 줄을 아래대로 고친다.

`admin/src/api/adminClient.test.ts`의 첫 테스트를 교체:

```ts
  it('쿠키를 함께 보내 /api/admin/scrapers를 부르고 data를 꺼낸다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok([]));

    await expect(getScraperStatuses()).resolves.toEqual([]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/scrapers');
    expect(init.credentials).toBe('same-origin');
    expect(init.headers['x-admin-api-key']).toBeUndefined();
  });
```

같은 파일의 `describe('adminClient', () => {` 블록 끝에 추가(imports에 `getMe, login, logout`를 `./adminClient`에서 가져온다):

```ts
  it('로그인은 이메일과 비밀번호를 JSON으로 POST 하고 사용자를 돌려준다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok({ email: 'admin@example.com' }));

    await expect(login('admin@example.com', 'pw-123456')).resolves.toEqual({ email: 'admin@example.com' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'admin@example.com', password: 'pw-123456' });
  });

  it('로그인 상태 확인과 로그아웃 경로', async () => {
    const fetchMock = mockFetch()
      .mockResolvedValueOnce(ok({ email: 'admin@example.com' }))
      .mockResolvedValueOnce(ok(null));

    await getMe();
    await logout();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/auth/me');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/admin/auth/logout');
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
  });

  it('잠긴 계정(429)은 서버 문구를 담은 ApiError로 던진다', async () => {
    mockFetch().mockResolvedValue(
      jsonResponse(429, { statusCode: 429, message: '로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요.' }),
    );

    const error = await login('admin@example.com', 'pw-123456').catch(e => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(UnauthorizedError);
    expect(error.message).toBe('로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요.');
  });
```

`admin/src/layout/AppLayout.test.tsx`: import를 `import { callsTo, ok, routeFetch } from '../test/http';`로 바꾸고, 로그아웃 테스트를 교체:

```tsx
  it('로그아웃하면 서버에 알리고 로그인 화면으로 간다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrapers': () => ok(allStatuses()),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      'POST /api/admin/auth/logout': () => ok(null),
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { loggedIn: true });

    await user.click(await screen.findByRole('button', { name: '로그아웃' }));

    expect(await screen.findByRole('heading', { name: '운영자 확인이 필요해요' })).toBeInTheDocument();
    expect(callsTo(fetchMock, 'POST', '/api/admin/auth/logout')).toHaveLength(1);
  });
```

`admin/src/pages/ScrapersPage.test.tsx`: 폴링 중 거절 테스트를 아래처럼 바꾼다(제목, 상태 코드, 마지막 `sessionStorage` 단언 줄 삭제).

```tsx
    it('폴링 중 세션이 만료되면(401) 로그아웃하고 로그인 화면으로 간다', async () => {
      let revoked = false;
      routeFetch({
        'GET /api/admin/scrapers': () =>
          revoked ? jsonResponse(401, { statusCode: 401, message: 'Unauthorized' }) : ok(allStatuses()),
```

(그 테스트 끝의 `expect(sessionStorage.getItem('admin.apiKey')).toBeNull();` 줄은 삭제한다.)

`admin/src/pages/ScrapeRunsPage.test.tsx`는 `renderApp` 인자만 바뀌었으므로 추가 수정이 없다.

- [ ] **Step 10: 어드민 전체 테스트, 타입체크, 빌드를 돌린다**

Run:
```bash
pnpm --dir admin test
pnpm --dir admin typecheck
pnpm --dir admin build
```
Expected: 모두 통과. 실패하는 기존 테스트가 있으면 `renderApp` 호출 전에 `routeFetch`가 먼저 불렸는지(헬퍼가 그 fetch를 감싸므로 순서가 중요하다)부터 확인한다.

- [ ] **Step 11: Commit**

```bash
git add -A admin
git commit -m "✨ feat: 어드민 웹 로그인을 이메일/비밀번호와 쿠키 세션으로 변경

API 키 입력과 sessionStorage 보관, x-admin-api-key 헤더를 제거하고 앱을 열 때 /auth/me로 로그인 상태를 확인한다.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 문서 정리와 전체 검증

**Files:**
- Modify: `admin/README.md`
- Modify: `docs/superpowers/specs/2026-09-25-admin-web-design.md` (맨 위 "이 문서는 ... 대체됨" 안내 한 줄)

**Interfaces:**
- Consumes: Task 1~6 전체

- [ ] **Step 1: 어드민 README를 고친다**

`admin/README.md`에서 아래 두 문장을 찾아 한 문단으로 바꾼다.

```markdown
<!-- 변경 전 (14~15줄) -->
로그인 화면에 API 서버의 `ADMIN_API_KEY` 값을 넣어요. 키는 브라우저 탭의 sessionStorage에만 남고, 탭을 닫으면 사라져요.
API 서버에 `ADMIN_API_KEY`가 설정돼 있지 않으면 모든 admin 요청이 403이라 로그인할 수 없어요.

<!-- 변경 후 -->
로그인 화면에 운영자 계정의 이메일과 비밀번호를 넣어요. 서버가 DB에 세션을 만들고 HttpOnly 쿠키로 돌려줘요(24시간, 쓰는 동안 연장). 연속 5번 틀리면 15분 동안 잠겨요.
계정은 API 서버에서 시드 스크립트로 만들어요: `ADMIN_SEED_EMAIL=... ADMIN_SEED_PASSWORD=... node dist/scripts/seed-admin.js` (`services/api/app`에서 `pnpm build` 뒤에 실행, 운영은 `docker compose exec -e ... app node dist/scripts/seed-admin.js`).
```

- [ ] **Step 2: 이전 어드민 설계 문서에 대체 안내를 단다**

`docs/superpowers/specs/2026-09-25-admin-web-design.md`의 첫 제목 바로 아래(빈 줄 다음)에 한 줄을 추가한다.

```markdown
> 인증은 2026-10-06 `2026-10-06-admin-login-design.md`로 대체됐다(API 키 입력 → 이메일/비밀번호 + DB 세션). 이 문서의 로그인·API 키 설명은 옛 방식이다.
```

- [ ] **Step 3: 저장소 전체 테스트와 빌드를 돌린다**

Run:
```bash
pnpm test
pnpm --dir services/api/app lint:check
pnpm --dir services/api/app build
pnpm --dir admin build
grep -rn "ADMIN_API_KEY\|x-admin-api-key" services admin/src --include=*.ts --include=*.tsx --exclude-dir=node_modules --exclude-dir=dist
```
Expected: 테스트·린트·빌드 통과, grep 결과 없음. (`pnpm test`는 api, mobile, admin을 모두 돈다. mobile 실패가 이번 변경과 무관하면 `git stash`로 변경을 빼고 같은 실패가 나는지 확인해 보고만 한다.)

- [ ] **Step 4: 로컬 스모크 테스트를 한다 (로컬 Postgres가 있을 때)**

```bash
# 1) 마이그레이션 적용 (DB_URL은 로컬 Postgres 접속 문자열)
psql "$DB_URL" -f supabase/migrations/20261006000000_add_admin_auth.sql
# 2) 계정 시드 (비밀번호는 로컬 확인용 임시 값을 쓰고 기록하지 않는다)
cd services/api/app && pnpm build
ADMIN_SEED_EMAIL=admin@example.com ADMIN_SEED_PASSWORD='local-test-pw-1' node --env-file=.env dist/scripts/seed-admin.js
# 3) 서버 실행 (다른 터미널)
pnpm start:dev
# 4) 흐름 확인
JAR="$TMPDIR/admin-cookies.txt"
curl -i localhost:3000/api/admin/scrapers                                   # 401
curl -i -c "$JAR" -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"local-test-pw-1"}' \
  localhost:3000/api/admin/auth/login                                       # 200 + Set-Cookie: admin_session=...; HttpOnly; SameSite=Lax
curl -i -b "$JAR" localhost:3000/api/admin/auth/me                          # 200 {"data":{"email":...}}
curl -i -b "$JAR" localhost:3000/api/admin/scrapers                         # 200
curl -i -b "$JAR" -c "$JAR" -X POST localhost:3000/api/admin/auth/logout    # 200, 쿠키 만료
curl -i -b "$JAR" localhost:3000/api/admin/auth/me                          # 401
# 5) 잠금: 틀린 비밀번호로 6번 로그인 → 앞 5번은 401, 6번째는 429
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code}\n" -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"wrong"}' localhost:3000/api/admin/auth/login; done
```

Expected: 주석에 적힌 상태 코드대로 나온다. 어드민 웹은 `pnpm --dir admin dev`로 띄워 `http://localhost:5173`에서 같은 계정으로 로그인되는지, 새로고침해도 유지되는지, 로그아웃하면 로그인 화면으로 가는지 눈으로 확인한다. DB가 없으면 이 단계는 건너뛰고 건너뛴 사실을 PR 본문에 적는다.

- [ ] **Step 5: Commit**

```bash
git add admin/README.md docs/superpowers/specs/2026-09-25-admin-web-design.md
git commit -m "📝 docs: 어드민 로그인 방식 변경 안내 반영

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: 배포 순서를 PR 본문에 남긴다 (PR을 만들 때)**

마이그레이션 적용(`db-migrate.yml`) → 운영 서버에서 시드 한 번(충분히 긴 비밀번호) → API 배포 → 어드민 배포. API와 어드민 변경을 한 PR로 같이 머지해야 한다(API가 새 가드로 바뀌면 옛 어드민 웹은 로그인할 수 없다). 서버 `.env`의 `ADMIN_API_KEY`는 배포 후 직접 지운다.
