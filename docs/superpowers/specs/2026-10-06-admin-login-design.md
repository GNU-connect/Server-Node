# 어드민 ID/PW 로그인 설계

- 작성일: 2026-10-06
- 대상: `services/api/app/src/api/admin/` (auth 신규, `common/guards` 교체), `supabase/migrations/` (신규), `admin/src/auth`, `admin/src/api`, `admin/src/pages/LoginPage.tsx`
- 선행: 어드민 웹 `docs/superpowers/specs/2026-09-25-admin-web-design.md`, 어드민 배포 `docs/superpowers/specs/2026-09-26-admin-deploy-design.md`

## 1. 목표

공유 API 키(`ADMIN_API_KEY`) 입력 방식을 이메일/비밀번호 로그인으로 바꾼다. 로그인 상태는 서버가 DB에 세션으로 저장하고, 브라우저는 HttpOnly 쿠키로 세션 토큰만 들고 있는다.

성공 기준:

- 어드민 로그인 화면에서 이메일과 비밀번호로 로그인하고, 틀리면 거절된다.
- 로그인하지 않은 상태로 `/api/admin/**`(auth 제외)를 부르면 401이 온다.
- 로그인 후 24시간 동안 활동이 없으면 세션이 만료되고, 활동하면 만료가 24시간으로 밀린다.
- 같은 계정으로 연속 5번 실패하면 15분 동안 로그인이 잠긴다.
- 로그아웃하면 그 세션이 즉시 무효가 된다.
- `ADMIN_API_KEY`와 `x-admin-api-key` 헤더 검사가 코드에서 사라진다.

## 2. 범위

포함:

- `admin_user`, `admin_session` 테이블 (Supabase 마이그레이션)
- `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`, `GET /api/admin/auth/me`
- `AdminSessionGuard` (기존 admin API 전체에 적용), `AdminApiKeyGuard` 제거
- 계정 시드 스크립트 (`pnpm seed:admin`)
- 어드민 웹 로그인 화면, 인증 컨텍스트, API 클라이언트 변경
- 서버 jest, 어드민 vitest 테스트 갱신

제외:

- 회원가입, 비밀번호 변경/재설정 화면, 계정 관리 화면
- 역할/권한 구분 (계정은 모두 같은 권한)
- 만료 세션 일괄 삭제 배치 (발견할 때 지우는 것으로 충분)
- 2단계 인증, IP 제한

## 3. 결정 사항

| 항목 | 결정 | 이유 |
|---|---|---|
| 세션 구현 | Nest에 직접 구현 (`express-session` 등 미사용) | 계정 1개 규모. 의존성 최소, 기존 TypeORM 구조와 맞음 |
| 비밀번호 해시 | `argon2` | 현재 권장 표준 |
| 세션 토큰 | `crypto.randomBytes(32)` hex, DB에는 SHA-256 해시만 저장 | DB가 유출돼도 토큰 원본으로 로그인 불가 |
| 쿠키 | `HttpOnly`, `SameSite=Lax`, 운영 `Secure`, `Path=/api/admin`, `Max-Age=24h` | 스크립트가 토큰을 못 읽음, 교차 출처 POST에 쿠키 미전송 |
| 만료 | 슬라이딩 24시간. 남은 시간이 23시간 미만일 때만 연장 | 요청마다 DB 쓰기를 피함 |
| 잠금 | 연속 실패 5회 → 15분 잠금, 잠금이 걸리면 실패 횟수를 0으로 | 무차별 대입 방어 |
| 계정 생성 | 시드 스크립트, 환경변수로 이메일/비밀번호 전달 | 가입 화면 불필요, 비밀번호가 git에 남지 않음 |
| 기존 키 | `ADMIN_API_KEY` 제거 | 어드민 웹 외에는 쓰는 곳이 없음 (확인함) |
| CSRF | `SameSite=Lax` + JSON 본문 요청 + 같은 출처(nginx 프록시, Vite 프록시) | 별도 토큰 불필요 |

## 4. DB

마이그레이션 `supabase/migrations/<timestamp>_add_admin_auth.sql`:

```sql
create table admin_user (
  id int generated always as identity primary key,
  email text not null unique,
  password_hash text not null,
  failed_login_count int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table admin_session (
  id int generated always as identity primary key,
  admin_user_id int not null references admin_user(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index admin_session_expires_at_idx on admin_session (expires_at);
```

두 테이블 모두 RLS를 켜고 정책은 만들지 않는다. Supabase 공개 REST(anon 키)로 비밀번호 해시가 읽히지 않게 막는 장치이고, API 서버는 `postgres` 역할로 접속해 RLS를 우회한다.

## 5. 서버 구조

```
services/api/app/src/api/admin/auth/
  auth.module.ts
  presentation/
    admin-auth.controller.ts        login, logout, me
    dtos/requests/login-request.dto.ts   email(IsEmail), password(IsString, IsNotEmpty)
  application/
    admin-auth.service.ts           로그인·잠금·세션 발급/검증/삭제
  domain/entities/
    admin-user.entity.ts
    admin-session.entity.ts
  infrastructure/
    admin-user.repository.ts
    admin-session.repository.ts
services/api/app/src/api/admin/common/guards/
  admin-session.guard.ts            (admin-api-key.guard.ts 삭제)
services/api/app/src/scripts/seed-admin.ts
```

단위별 책임:

- `AdminAuthService`가 인증 규칙(잠금, 해시 비교, 토큰 발급, 슬라이딩)을 모두 안다. 컨트롤러는 쿠키 읽기/쓰기와 응답만 한다.
- `AdminSessionGuard`는 `AdminAuthService.validateSession(token)`만 부르고, 결과에 따라 요청에 `adminUser`를 붙이거나 401을 던진다. 쿠키를 연장해야 하면 응답에 새 쿠키를 세팅한다.
- 레포지토리는 DB 접근만 한다.

`main.ts`에 `cookie-parser`를 등록하고, 기존 CORS(`credentials: true`)는 그대로 둔다. Swagger의 `X-ADMIN-API-KEY` 항목은 지운다.

새 의존성: `argon2`, `cookie-parser`(+ `@types/cookie-parser`).

## 6. 인증 흐름

### 로그인 `POST /api/admin/auth/login` `{ email, password }`

1. 이메일은 앞뒤 공백을 지우고 소문자로 바꿔 사용자를 찾는다(시드도 같은 규칙으로 저장한다).
2. 사용자가 없으면 더미 해시로 `argon2.verify`를 한 번 돌린 뒤 401을 던진다(응답 시간으로 계정 존재 여부가 드러나지 않게).
3. `locked_until > now`면 429 `로그인 시도가 너무 많아요. N분 뒤에 다시 시도해 주세요.`
4. 비밀번호가 틀리면 `failed_login_count + 1`. 5가 되면 `locked_until = now + 15분`, 횟수는 0으로. 401을 던진다.
5. 성공하면 횟수 0, `locked_until` null. 해당 사용자의 만료된 세션을 지운다. 토큰을 만들어 해시와 `expires_at = now + 24h`를 저장하고 쿠키를 세팅한다.
6. 응답 `{ email }`.

실패 문구는 이메일 없음과 비밀번호 틀림 모두 `이메일 또는 비밀번호가 맞지 않아요.`로 같다. 잠금 상태는 이메일이 존재할 때만 알려준다.

### 세션 검증 (`AdminSessionGuard`)

1. 쿠키 `admin_session`이 없으면 401.
2. 토큰을 SHA-256 해시해 `admin_session`을 조회한다. 없으면 401.
3. `expires_at <= now`면 행을 지우고 401.
4. `expires_at - now < 23시간`이면 `expires_at = now + 24h`로 갱신하고 쿠키 `Max-Age`도 24시간으로 다시 세팅한다.
5. 요청에 `adminUser`(id, email)를 붙인다.

### 로그아웃 `POST /api/admin/auth/logout`

세션 행을 삭제하고 쿠키를 지운다. 이미 무효인 세션이어도 성공이고, 응답은 200 `{ data: null }`이다(어드민 클라이언트가 본문을 항상 JSON으로 읽는다).

### 현재 사용자 `GET /api/admin/auth/me`

가드를 통과하면 `{ email }`을 돌려준다. 어드민 웹이 앱을 열 때 로그인 상태를 확인하는 용도다.

로그인 외 `/api/admin/**` 컨트롤러(기존 scrape-runs)의 가드는 `AdminSessionGuard`로 바꾼다. `login`만 가드 없이 열려 있다.

## 7. 계정 시드

`pnpm seed:admin` (`services/api/app`, 빌드된 `dist/scripts/seed-admin.js`를 실행하므로 운영 이미지에서도 돈다): 환경변수 `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`를 읽어 argon2 해시로 `admin_user`에 upsert한다. 이미 있으면 비밀번호 해시만 갱신하고 실패 횟수·잠금을 초기화한다. 두 값 중 하나라도 없으면 아무것도 하지 않고 종료 코드 1로 끝난다. 비밀번호는 코드, 마이그레이션, 문서에 적지 않는다. 운영 서버에서는 충분히 긴 비밀번호로 한 번 실행한다.

## 8. 어드민 웹 변경

- `LoginPage`: 이메일 `TextField`와 비밀번호 `TextField`(보기/숨기기). 설명 문구는 "운영자 계정으로 로그인해 주세요." 오류 문구는 서버 메시지를 그대로 보여준다(401, 429).
- `AuthContext`: 상태 `user: { email } | null`과 `loading`. 마운트 시 `GET /auth/me`로 확인한다. `login(email, password)`, `logout()`을 제공한다.
- `RequireAuth`: `loading`이면 빈 화면(또는 간단한 로딩), `user`가 없으면 `/login`으로 보낸다.
- `adminClient`: `apiKey` 인자와 `x-admin-api-key` 헤더를 제거하고 `credentials: 'same-origin'`을 쓴다. `ScrapersPage`, `ScrapeRunsPage` 등 호출부에서 키 전달도 제거한다. 401을 받으면 로그아웃 처리 후 `/login`으로 이동한다(로그인 요청 자체의 401은 화면에서 오류로 표시).
- `keyStorage.ts`, `useApiKey` 삭제. `admin/README.md`의 `ADMIN_API_KEY` 설명을 새 방식으로 고친다.

## 9. 테스트

서버 (jest):

- `AdminAuthService`: 로그인 성공 시 세션 발급, 틀린 비밀번호 시 횟수 증가, 5회째 잠금과 429, 잠금 시간이 지나면 다시 로그인 가능, 없는 이메일도 401, 토큰이 해시로만 저장됨.
- 세션 검증: 만료 거부, 23시간 미만 남으면 연장, 23시간 이상이면 연장하지 않음.
- `AdminSessionGuard`: 쿠키 없음/무효/만료 401, 유효 시 통과와 `adminUser` 첨부.
- 컨트롤러: 쿠키 속성(`HttpOnly`, `SameSite=Lax`), 로그아웃 시 쿠키 삭제.
- 기존 `admin-api-key.guard.spec.ts` 삭제, scrape-runs 컨트롤러 테스트는 새 가드로 갱신.

어드민 (vitest):

- `LoginPage`: 성공 시 이동, 401 문구, 429 문구.
- `AuthContext`/`RequireAuth`: `/me` 성공 시 통과, 401이면 `/login`, 로딩 중 보호 화면이 깜빡이지 않음.
- `adminClient`: 키 헤더 없음, `credentials` 포함, 401 에러 타입.
- 기존 테스트에서 `x-admin-api-key` 관련 부분 제거.

## 10. 배포·운영 메모

- 마이그레이션은 기존 `db-migrate.yml`이 적용한다. 배포 순서는 마이그레이션 → 시드 → API 배포 → 어드민 배포다.
- 시드는 서버에서 환경변수와 함께 수동으로 한 번 실행한다.
- API가 새 가드로 바뀌면 옛 어드민 웹은 로그인할 수 없다. 어드민 CD가 API와 같은 시점에 배포되도록 PR을 함께 머지한다.
- 서버 환경변수 `ADMIN_API_KEY`는 배포 후 정리한다(코드는 더 이상 읽지 않는다).
- nginx는 `Cookie`/`Set-Cookie`를 기본으로 전달하므로 설정 변경은 필요 없다(구현 중 확인).
