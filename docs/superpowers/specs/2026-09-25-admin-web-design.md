# 커넥트 지누 어드민 웹 설계

- 작성일: 2026-09-25
- 대상: `admin/` (신규), 루트 `package.json`
- 참고: 커넥트 지누 디자인 시스템 아티팩트 (https://claude.ai/artifact/GAP9Ps56WZuu2UgUS2hZSB), `services/api/app/src/api/admin/scrape-runs`

## 1. 목표

운영자가 배치 수집(셔틀·공지·학식·학사일정)의 상태를 한눈에 확인하고, 필요하면 수동으로 다시 돌릴 수 있는 로컬 전용 어드민 웹을 만든다.

성공 기준:

- `ADMIN_API_KEY`를 입력해 로그인하고, 잘못된 키는 거절된다.
- `/scrapers`에서 수집 타입 4종의 최근 실행 상태·마지막 성공 시각·실패 오류를 볼 수 있다.
- "지금 수집"으로 수동 실행을 요청하고, 상태가 pending → running → succeeded/failed로 바뀌는 것을 새로고침 없이 본다.
- `/scrape-runs`에서 실행 기록을 타입·상태로 걸러 보고 커서로 더 불러온다.
- 화면이 디자인 시스템의 토큰·컴포넌트·말투 규칙을 따른다.

## 2. 범위

포함:

- `admin/` Vite + React + TypeScript 앱, 로그인·수집 상태·실행 기록 화면
- 디자인 시스템 토큰(CSS 변수, 라이트/다크)과 필요한 컴포넌트의 TSX 이식
- 데스크톱 어드민 셸(사이드바·상단 바·브레드크럼)
- Vitest 단위/컴포넌트 테스트, 루트 `test:admin` 스크립트

제외:

- 서버 코드 변경 (CORS, 인증 방식 포함)
- 배포(nginx 서빙, 정적 호스팅), CI 연동
- 홈/대시보드 요약 화면, 사용자 계정·권한 구분
- 모바일 레이아웃 최적화 (데스크톱 1280px 이상 기준, 좁아져도 깨지지만 않게)

## 3. 결정 사항

| 항목 | 결정 | 이유 |
|---|---|---|
| 앱 위치·도구 | `admin/`에 Vite + React 18 + TS, pnpm 독립 패키지 | 사용자 앱(`mobile`)과 분리, 빠른 로컬 개발 |
| 인증 | 로그인 화면에서 API 키 입력 → `GET /api/admin/scrapers`로 검증 → `sessionStorage` 보관 | 서버 변경 없음, 탭을 닫으면 키가 사라짐 |
| API 호출 | Vite dev 프록시 `/api` → `VITE_API_TARGET` (기본 `http://localhost:3000`) | 서버 CORS 변경 불필요, prod/dev 서버 모두 연결 가능 |
| 라우팅 | `react-router-dom` v6: `/login`, `/scrapers`, `/scrape-runs`, `/` → `/scrapers` | 사이드바 메뉴 구조와 브레드크럼 |
| 데이터 패칭 | `fetch` 래퍼 + 작은 커스텀 훅 (라이브러리 없음) | 엔드포인트 4개, YAGNI |
| 디자인 시스템 | `tokens.json` → `tokens.css`, `bundle.css` → `jinu.css` 복사, 컴포넌트 7종 TSX 이식 | 타입 안전, 원본과 같은 클래스명으로 동일한 외형 |
| 테스트 | Vitest + Testing Library + jsdom, `fetch`는 `vi.fn`으로 대체 | Vite와 설정 공유 |

## 4. 구조

```
admin/
  index.html
  package.json
  vite.config.ts           /api 프록시, vitest 설정
  .env.example             VITE_API_TARGET=http://localhost:3000
  public/jinu-app-icon.webp
  src/
    main.tsx               라우터·AuthProvider 마운트
    App.tsx                라우트 정의, RequireAuth
    design/
      tokens.css           라이트(:root) / 다크(prefers-color-scheme) 변수, 폰트·간격·모서리·그림자·크기 변수
      jinu.css             bundle.css 복사본 (@import 폰트 포함)
      admin.css            셸·표·입력창 등 어드민 전용 스타일 (토큰만 사용)
      components/          Button, Card, Badge, Chip, Notice, EmptyState, Icon (디자인 시스템 이식)
                           TextField, DataTable, Section (어드민 전용 신규)
    layout/
      AppLayout.tsx        Sidebar + Topbar + <Outlet/>
      Sidebar.tsx          로고, 접기 버튼, NavGroup
      Topbar.tsx           Breadcrumb, 로그아웃
    api/
      adminClient.ts       요청 함수와 에러 타입
      types.ts             ScrapeRun, ScraperStatus 등 응답 타입
    auth/
      AuthContext.tsx      apiKey, login(key), logout()
      keyStorage.ts        sessionStorage 읽기/쓰기 (try/catch)
    features/scrapers/
      labels.ts            타입·상태·트리거 한글 라벨, Badge tone 매핑
      format.ts            시각·소요 시간 포맷
      usePolling.ts        간격이 바뀌는 폴링 훅
      ScraperCard.tsx
      RunTable.tsx
      RunDetailPanel.tsx
    pages/
      LoginPage.tsx
      ScrapersPage.tsx
      ScrapeRunsPage.tsx
```

각 단위의 책임:

- `adminClient`는 HTTP만 안다. 화면·저장소를 모른다. 키는 인자로 받는다.
- `AuthContext`는 키 보관과 로그인 검증만 한다. 401/403을 받은 곳은 `logout()`을 부른다.
- `features/scrapers`의 컴포넌트는 데이터를 props로 받아 그리기만 하고, 패칭은 페이지가 한다.

## 5. API 클라이언트

엔드포인트 (모두 헤더 `x-admin-api-key`, 응답 본문 `{ data, message, statusCode }` 형태의 `NativeResponseDto`에서 `data`를 꺼낸다):

| 함수 | 요청 | 반환 |
|---|---|---|
| `getScraperStatuses(key)` | `GET /api/admin/scrapers` | `ScraperStatus[]` |
| `listScrapeRuns(key, {type?, status?, cursor?, limit?})` | `GET /api/admin/scrape-runs` | `{ items: ScrapeRun[], nextCursor: number \| null }` |
| `getScrapeRun(key, id)` | `GET /api/admin/scrape-runs/:id` | `ScrapeRun` |
| `requestScrapeRun(key, type)` | `POST /api/admin/scrape-runs` `{type}` | `ScrapeRun` (202) |

타입:

```ts
type ScrapeRunType = 'shuttle' | 'notice' | 'cafeteria' | 'academic-calendar';
type ScrapeRunStatus = 'pending' | 'running' | 'succeeded' | 'failed';
interface ScrapeRun {
  id: number; type: ScrapeRunType; trigger: 'cron' | 'manual'; status: ScrapeRunStatus;
  errorMessage: string | null; createdAt: string; startedAt: string | null; finishedAt: string | null;
}
interface ScraperStatus { type: ScrapeRunType; latestRun: ScrapeRun | null; lastSucceededRun: ScrapeRun | null }
```

에러 매핑:

| 응답 | 던지는 에러 | 화면 처리 |
|---|---|---|
| 401, 403 | `UnauthorizedError` | 로그인 화면: "키가 맞지 않아요. 다시 확인해 주세요." / 그 외: 로그아웃 후 `/login` |
| 409 | `ConflictError` | "이미 수집이 대기 중이거나 실행 중이에요." |
| 그 외 4xx/5xx | `ApiError(status, message)` | danger Notice: 무엇이 안 됐는지 + 다시 시도 버튼 |
| 네트워크 실패 | `NetworkError` | "서버에 연결하지 못했어요. 서버가 켜져 있는지 확인해 주세요." |

Nest 가드가 false를 반환하면 403이 오므로 403도 인증 실패로 본다.

에러 응답 본문은 전역 `HttpExceptionFilter`가 만드는 `{ statusCode, message, path, timestamp }`이고, `message`는 문자열 또는 문자열 배열(검증 오류)이다. `ApiError.message`에는 배열이면 `, `로 이어 붙인 값을 넣는다. 본문이 JSON이 아니면 `HTTP <status>`를 쓴다.

## 6. 화면

### 공통 셸 (`AppLayout`)

- 왼쪽 사이드바 폭 248px(접으면 72px, 아이콘만). 바탕 `bg`, 오른쪽 경계 `line`.
  - 상단: 지누 아이콘 32px(모서리 10px) + "커넥트 지누 어드민"(`heading`), 접기 버튼(`chevron`).
  - 메뉴: "수집 관리" 그룹(펼침/접힘) 아래 "수집 상태"(`/scrapers`), "실행 기록"(`/scrape-runs`).
  - 선택된 메뉴: `jinu-blue-tint` 바탕, `jinu-blue-ink` 글자, `radius-sm`. 그 외 `ink-muted`.
  - 접힘 상태는 `localStorage`(`admin.sidebarCollapsed`)에 기억, 접근 실패 시 기본 펼침.
- 상단 바 높이 64px, 바탕 `bg`, 아래 경계 `line`: 왼쪽 브레드크럼("수집 관리 › 수집 상태"), 오른쪽 "로그아웃" ghost 버튼.
- 본문: 바탕 `bg-soft`, 안쪽 여백 `space-8`, 최대 폭 1200px. 페이지 제목은 `title`(22px 700).

### `/login`

- 셸 없음. `bg-soft` 가운데 폭 400px `Card`.
- 지누 아이콘 72px, `display` 서체 인사 "운영자 확인이 필요해요", `body` 설명 "ADMIN_API_KEY를 입력하면 수집 상태를 볼 수 있어요."
- 비밀번호형 `TextField`(라벨 "어드민 API 키", 보기/숨기기 토글) + primary `Button` block "들어가기".
- 빈 값이면 버튼 비활성. 검증 중에는 "확인하는 중…"으로 바꾸고 비활성.
- 이미 로그인 상태면 `/scrapers`로 이동. 로그인 후에는 원래 가려던 경로로 이동.

### `/scrapers` 수집 상태

- 페이지 헤더: 제목 "수집 상태", 오른쪽에 `caption` "3초 전 갱신" + ghost 버튼 "새로고침"(`refresh` 아이콘).
- 실패한 수집이 하나라도 있으면 헤더 아래 danger `Notice`: "학식 수집이 실패했어요. 카드의 오류를 확인하고 다시 수집해 주세요."
- 카드 그리드(4열, 좁으면 2열). `ScraperCard` 하나:
  - 제목: 타입 라벨(셔틀 / 공지사항 / 학식 / 학사 일정), 아이콘(bus / bell / meal / calendar).
  - 상태 `Badge`: 대기 중(neutral, `clock`) · 수집 중(blue, `refresh`) · 성공(success, `check`) · 실패(danger, `alert`) · 기록 없음(neutral).
  - 정보 표(라벨 열 + 값): 최근 실행 "9월 25일(목) 14:20 · 자동", 소요 "1분 12초", 마지막 성공 "9월 25일(목) 14:20".
  - 실패면 오류 메시지를 danger `Notice`로(3줄에서 자르고 "실행 기록에서 전체 보기" 링크).
  - `soft` 버튼 "지금 수집". 최근 실행이 pending/running이면 비활성 + 라벨 "수집 중…".
  - 요청 성공 시 즉시 목록을 다시 불러오고, 409면 카드 안에 info Notice로 안내.
- "최근 실행" `Section`(접기 가능): 최근 10건 `RunTable` + "실행 기록 전체 보기" 링크.

### `/scrape-runs` 실행 기록

- 필터: 타입 Chip(전체·셔틀·공지사항·학식·학사 일정), 상태 Chip(전체·대기 중·수집 중·성공·실패). 필터 바꾸면 처음부터 다시 조회.
- `RunTable` 열: 번호, 타입, 트리거(자동/수동), 상태 Badge, 요청 시각, 소요 시간, 오류(한 줄 말줄임).
- 목록 아래 soft 버튼 "더 보기"(`nextCursor`가 있을 때만). 20건씩.
- 행 클릭 → 오른쪽 `RunDetailPanel`(폭 420px, 오버레이 없이 고정): 라벨 열 표로 전 필드, 오류 메시지 전문(`pre`, 줄바꿈 유지). 닫기 버튼, Esc로 닫힘. 진행 중 run이면 3초마다 `getScrapeRun`으로 갱신.
- 결과 없음: `EmptyState` "조건에 맞는 실행 기록이 없어요" + "필터 초기화" 버튼.

## 7. 폴링

- `usePolling(fn, intervalMs, enabled)`: 마운트 시 즉시 1회, 이후 `intervalMs`마다. 간격이 바뀌면 타이머를 다시 건다. 이전 요청이 끝나기 전에는 다음 요청을 보내지 않는다. 문서가 숨겨지면(`visibilitychange`) 멈추고 보이면 즉시 1회 후 재개.
- `/scrapers`: pending/running인 타입이 있으면 3초, 없으면 30초.
- 폴링 실패는 마지막 성공 데이터를 유지한 채 상단에 danger Notice를 띄운다. `UnauthorizedError`면 로그아웃.

## 8. 표기 규칙 (디자인 시스템 말투)

- 해요체, 결론부터, 사과로 시작하지 않음, 이모지 없음.
- 시각 24시간 `14:20`, 날짜 "9월 25일(목)", 오늘이면 "오늘 14:20". 소요 "1분 12초", 1분 미만 "42초". 진행 중이면 "진행 중".
- 상태색은 항상 단어·아이콘과 함께. 파랑 채움(primary)은 로그인 버튼에만, 선택된 Chip은 예외(디자인 시스템 규칙상 "지금 고른 것").
- 숫자·시각은 `font-variant-numeric: tabular-nums`.

## 9. 테스트

- `adminClient`: 헤더 부착, `data` 추출, 401/403/409/500/네트워크 실패의 에러 타입.
- `format`, `labels`: 시각·소요 포맷, 상태 → 라벨/tone.
- `usePolling`: fake timer로 즉시 호출, 간격 변경, 중복 요청 방지.
- `LoginPage`: 성공 시 키 저장 후 이동, 401 시 오류 문구.
- `ScraperCard`: 상태별 Badge, 진행 중이면 버튼 비활성, 실패 시 오류 표시.
- `ScrapersPage`: 수동 실행 → 409 안내, 진행 중일 때 3초 폴링.
- `ScrapeRunsPage`: 필터 변경 시 쿼리, "더 보기" 커서 전달.
- 루트 `package.json`에 `test:admin` 추가, `test`에 포함.

## 10. 실행 방법

```bash
cd admin && pnpm install
cp .env.example .env.local   # 필요 시 VITE_API_TARGET 변경 (예: https://api.connectgnu.kro.kr)
pnpm dev                      # http://localhost:5173
```

API 서버에 `ADMIN_API_KEY`가 설정돼 있어야 한다. 설정이 없으면 모든 admin 요청이 403이다.
