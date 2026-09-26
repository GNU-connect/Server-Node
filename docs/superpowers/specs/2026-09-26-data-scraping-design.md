# 학사일정·학교 공지·학식 수집 배치 설계

- 작성일: 2026-09-26
- 대상: `services/api/batch`(수집 잡 3종, `BatchService`), `services/api/app`(어드민 scrape-runs API), `admin`(어드민 웹), `supabase/migrations`(신규)
- 선행: 셔틀 수집 잡(구현 완료), `scrape_run` 도입(`20260925000000_add_scrape_run.sql`), 어드민 웹(`docs/superpowers/specs/2026-09-25-admin-web-design.md`)
- 참고: Python 수집기 `GNU-connect/web-scraping`(GitHub Actions + Selenium/requests). 이 작업은 그 수집기를 NestJS 배치로 옮기는 리팩토링이다.

## 1. 목표

Python 수집기가 하던 학사일정·학교 공지·교내 식당 학식 수집을 `services/api/batch`의 잡으로 옮긴다. 식당·게시판처럼 대상이 여러 개인 수집은 대상마다 `scrape_run`을 남겨, 어드민에서 대상별로 성공·실패·소요 시간을 보고 대상 하나만 재실행할 수 있게 한다. 이후 학과 공지도 같은 구조로 추가할 수 있어야 한다.

성공 기준:

- 매시 정각 cron과 어드민 수동 실행으로 세 잡이 데이터를 갱신한다.
- 학식은 식당마다, 학교 공지는 카테고리마다 `scrape_run` 행이 생기고, 한 대상이 실패해도 나머지는 계속 수집된다.
- 어드민에서 「전체 수집」과 대상별 「지금 수집」을 모두 실행할 수 있다.
- 학과 공지 추가는 새 잡 하나와 타입 하나 추가로 끝나고, 스키마와 어드민 구조를 바꾸지 않는다.

## 2. 범위

포함:

- 잡 3개: `academic-calendar`, `cafeteria`, `university-notice`
- `scrape_run.target` 도입, 대상별 활성 run 락, `BatchService`의 대상별 실행
- 어드민 API의 `target` 지원과 대상별 상태 조회, 어드민 웹의 대상별 표시와 실행
- 파서·클라이언트·잡·서비스 테스트

범위 밖:

- 잡별 스케줄 분리(지금처럼 매시 정각 전체 순차 실행)
- 공지 보존 기간 정책, 과거 공지 백필
- 학과 공지 구현(구조만 대비)
- Slack 실패 알림(어드민에서 `failed`를 확인한다. 별도 이슈)
- 기존 셔틀 잡·파서 변경

## 3. 데이터 모델과 실행 구조

### 3.1 DB 마이그레이션

- `scrape_run.target varchar(50) null` 추가. 대상 없는 타입(`shuttle`, `academic-calendar`)은 `null`, `cafeteria`는 식당 id, `university-notice`는 `notice_category.id`의 문자열이다.
- `type` 체크 제약: `notice`를 `university-notice`로 바꾼다. 기존 `notice` 이력 행은 `university-notice`로 옮긴다(target은 `null`인 채로 둔다). 허용 값은 `shuttle`, `university-notice`, `cafeteria`, `academic-calendar`이며, 학과 공지는 나중에 `department-notice`를 추가한다.
- 활성 run 유니크 인덱스를 `(type, coalesce(target, ''))` where `status in ('pending','running')`로 교체한다. 같은 대상은 동시에 하나만 돌고, 다른 대상은 병렬로 대기·실행할 수 있다.
- 이력 조회 인덱스를 `(type, target, id desc)`로 교체한다.
- `notice`에 `(category_id, ntt_sn)` 유니크 인덱스를 추가한다. 적용 전에 기존 중복 행이 없는지 확인하는 쿼리를 마이그레이션 PR에 남기고, 중복이 있으면 정리 후 적용한다.

### 3.2 배치 잡 인터페이스

```ts
interface BatchJob {
  readonly name: string; // scrape_run.type
  targets?(): Promise<string[]>; // 없으면 대상 없는 잡
  run(target?: string): Promise<void>;
}
```

- 잡 이름: `shuttle`, `academic-calendar`, `cafeteria`, `university-notice`.
- `targets()`는 `cafeteria` 목록, `notice_category`(`department_id = 117`) 목록을 DB에서 읽는다.
- cron: `targets()`가 있는 잡은 대상마다 run을 만들어 순차 실행한다. 한 대상이 실패해도 나머지는 계속 실행하고, 각 run에 성공·실패가 각자 남는다. 활성 run이 있는 대상은 건너뛴다.
- 수동 실행(pending run 소비): `target`이 있으면 `job.run(target)`, 없으면 대상 없는 잡의 `job.run()`이다. 대상이 있는 타입의 「전체 수집」은 어드민 API가 대상별 pending run을 만들어 처리한다(4.1).

## 4. 어드민 API와 웹

### 4.1 API (`services/api/app`)

- `SCRAPE_RUN_TYPES`와 `ScrapeRun` 엔티티, 응답 DTO에 `university-notice`와 `target`을 반영한다.
- `POST /scrape-runs`는 `{ type, target? }`를 받는다.
  - `target` 있음: 그 대상의 pending run 하나를 만든다. 목록에 없는 대상은 400, 이미 활성 run이 있으면 409.
  - `target` 없음, 대상이 있는 타입: 대상마다 pending run을 만들되 활성 run이 있는 대상은 건너뛴다. 하나도 못 만들면 409.
  - `target` 없음, 대상 없는 타입: 지금과 같다.
  - 응답은 항상 `{ runs: ScrapeRun[] }`이다(어드민 웹과 함께 변경).
- 상태 조회는 타입별 요약에 더해, 대상이 있는 타입에 `targets: [{ target, targetName, latestRun, lastSucceededRun }]`를 돌려준다. `targetName`은 식당명, 카테고리명이다.
- 이력 목록에 `target` 필터를 추가한다.

### 4.2 웹 (`admin`)

- 타입 라벨·아이콘에 `university-notice`(학교 공지)를 반영한다.
- 학식·학교 공지 카드는 요약(예: 성공 11 · 실패 1)과 대상별 목록을 보여주고, 대상별 「지금 수집」과 「전체 수집」 버튼을 둔다. 셔틀·학사일정 카드는 그대로다.
- 이력 표와 상세 패널에 대상 이름 컬럼과 대상 필터를 추가한다.

## 5. 수집 잡

### 5.1 공통

- 셔틀 잡과 같은 구조: `client`(HTTP) → `parser`(순수 함수) → `repository`(TypeORM) → `job`(조립). 배치는 자체 엔티티를 쓰므로 `academic_calendar`, `cafeteria`, `cafeteria_diet`, `notice`, `notice_category` 엔티티를 `services/api/batch`에 추가한다.
- HTML 파싱에는 `cheerio`를 새로 도입한다(셔틀 파서는 변경하지 않는다).
- 예외를 삼키지 않고 던져서 `scrape_run`에 `failed`와 `error_message`로 기록한다(Python은 실패해도 정상 종료였다).
- 삭제 후 삽입은 항상 한 트랜잭션으로 묶는다(Python은 중간 실패 시 데이터가 비었다).

### 5.2 학사일정 `academic-calendar` (대상 없음)

- 수집: 페이지가 내부적으로 쓰는 `POST /main/ps/schdul/selectSchdulList.do?mi=1084`에 `schdulLevel=Y`, `srchYear`, `menuId=1084`, `sysId=main`을 보낸다. 올해와 내년 두 번 호출한다. 메인 페이지를 GET하면 빈 컨테이너만 오고, 데이터는 이 POST 응답에 있다(2026년 110건, 2027년 19건을 확인했다). 응답은 JSON 문자열로 감싼 HTML이다.
- 파싱: `viewSchdulInfo('번호','시작','종료',…)`에서 날짜를, 링크 텍스트에서 `[학부]`/`[대학원]` 분류와 내용을 뽑는다. 종료일이 어제 이전이면 제외하고, 같은 (분류, 시작, 종료, 내용)은 중복 제거한다. 분류는 `학부=1`, 그 외 `2`.
- 저장: 한 트랜잭션에서 `academic_calendar` 전체 삭제 후 삽입.
- 실패: 결과 0건이면 실패 처리하고 기존 데이터를 유지한다.

### 5.3 학식 `cafeteria` (대상: 식당 id)

- 수집: 식당 행의 `type`, `rest_seq`, `mi`, `sch_sys_id`로 `https://www.gnu.ac.kr/{type}/ad/fm/foodmenu/selectFoodMenuView.do?restSeq=…&mi=…[&schSysId=…]`를 GET한다.
- 파싱: 표 헤더에서 요일별 날짜를, 행에서 시간대(아침·점심·저녁, `form_type = 2`이거나 교육문화식당이면 점심 고정에 구분 주식·국류·찬류·후식)를, 칸에서 카테고리와 메뉴 항목을 뽑는다. Python 로직과 같은 결과를 내도록 이식한다.
- 저장: 한 트랜잭션에서 그 식당의 해당 주(시작~종료 날짜) `cafeteria_diet`를 삭제 후 삽입.
- 실패: 표 구조를 못 찾으면 실패. 메뉴가 0건이면 데이터를 바꾸지 않고 성공으로 기록한다.

### 5.4 학교 공지 `university-notice` (대상: `notice_category.id`)

- 수집: 카테고리 행의 `mi`, `bbs_id`로 `https://www.gnu.ac.kr/main/na/ntt/selectNttList.do?mi=…&bbsId=…`를 GET한다(첫 페이지만).
- 파싱: `등록일`, `nttInfoBtn`의 `data-id`(`ntt_sn`), 제목을 뽑는다.
- 저장 정책(Python에서 변경): 카테고리당 개수 제한 없이 누적한다. `ntt_sn > last_ntt_sn`인 새 글을 모두 `INSERT … ON CONFLICT (category_id, ntt_sn) DO NOTHING`으로 저장하고, 같은 트랜잭션에서 `last_ntt_sn`을 갱신한다. 30일 필터와 5건 제한은 폐지한다. 재실행해도 중복이 생기지 않는다.
- 실패: 표 구조를 못 찾으면 실패. 새 글 0건은 정상이다.
- 조회 API는 이미 카테고리당 개수를 제한해 읽으므로 변경하지 않는다.

## 6. 테스트

- `parser`: 실제 사이트에서 저장한 fixture HTML/JSON으로 단위 테스트한다(학사일정 응답, 식당 `form_type` 1과 2, 공지 목록). 구조를 못 찾을 때 에러가 나는지도 검증한다.
- `client`: HTTP 클라이언트를 mock해 URL과 POST 바디를 검증한다.
- `job`: client, parser, repository를 fake로 바꿔 조립을 검증한다.
- `BatchService`: 대상 확장, 한 대상이 실패해도 나머지 실행, 활성 run 충돌 시 건너뛰기, 수동 target 실행.
- 어드민 API 서비스 spec(target 검증, 대상별 run 생성)과 어드민 컴포넌트 테스트.
- 저장소의 트랜잭션·유니크 동작은 로컬 Supabase에서 한 번 수동 확인하고 결과를 PR에 남긴다.

## 7. 롤아웃

PR 단위로 앞 단계가 뒤 단계의 전제다.

1. 마이그레이션 + `BatchService` 대상 지원 + 어드민 API 변경
2. 학사일정 잡
3. 학식 잡
4. 학교 공지 잡
5. 어드민 웹 UI

운영 전환 시 주의:

- 잡 하나를 켤 때 같은 날 `web-scraping` 레포의 해당 GitHub Actions 스케줄을 끈다. 학식·학사일정은 삭제 후 재삽입이라 두 곳에서 동시에 돌면 서로 덮어쓰고, 공지는 유니크 인덱스로 중복은 막히지만 `last_ntt_sn`이 엇갈린다.
- 마이그레이션 적용 후 새 코드 배포 전까지 구버전 배치가 만드는 `notice` 타입 run이 체크 제약에 걸려 실패할 수 있다. 매시 cron이라 영향은 한 사이클이고 실패는 기록된다. 마이그레이션과 API·배치 배포는 같은 릴리스에서 진행한다.

## 8. 구현 중 확인한 사항

- Python `cafeteria_repository.py`는 식단 삽입 후 `cafeteria.last_date`를 식단의 마지막 날짜로 갱신한다. 이식했다(`CafeteriaRepository.replaceWeek`가 같은 트랜잭션에서 식단 중 가장 늦은 날짜로 갱신한다).
- 학사일정 POST는 세션·쿠키 없이 동작하고, 실제 응답(2026년 110건)을 파서가 그대로 해석하는 것을 확인했다. 사이트가 바뀌어도 0건이면 실패로 기록하고 기존 데이터를 유지한다.
- 5.2의 "종료일이 어제 이전이면 제외"는 Python과 같은 동작으로 구현했다. 종료일이 오늘보다 이르면(어제 종료 포함) 제외한다.
- `academic_calendar`의 유니크 제약 `(calendar_type, content, start_date)` 때문에, 같은 (분류, 내용, 시작일)은 종료일이 달라도 하나만 저장한다(먼저 나온 것).
- 로컬 Postgres에서 저장소들의 실제 SQL 동작을 확인했다: 대상별 활성 run 락, `claimPending`의 target 반환, 공지 재실행 멱등(`ON CONFLICT`)과 `last_ntt_sn` 단조 증가, 식단 삽입 실패 시 삭제 롤백, 학사일정 유니크 위반 시 롤백.
