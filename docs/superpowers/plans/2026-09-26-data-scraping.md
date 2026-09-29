# 학사일정·학교 공지·학식 수집 배치 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Python 수집기(`GNU-connect/web-scraping`)의 학사일정·학교 공지·학식 수집을 NestJS 배치 잡으로 옮기고, 식당·게시판 같은 대상(target)마다 `scrape_run`을 남겨 어드민에서 대상별로 보고 재실행할 수 있게 한다.

**Architecture:** `scrape_run`에 nullable `target`을 추가하고 활성 run 락을 `(type, target)` 단위로 바꾼다. `BatchJob`이 선택적으로 `targets()`를 제공하면 `BatchService`가 대상마다 run을 만들어 실행한다. 잡은 셔틀 잡과 같은 `client → parser(cheerio) → repository(트랜잭션) → job` 구조이고, 어드민 API·웹은 `target`을 받아 대상별 상태를 보여 준다.

**Tech Stack:** NestJS 11, TypeORM(postgres), `cheerio`(신규), Jest(`services/api/batch`, `services/api/app`), React + Vitest(`admin`), Supabase migration.

**Spec:** `docs/superpowers/specs/2026-09-26-data-scraping-design.md`

## Global Constraints

- `scrape_run.type` 허용 값은 `shuttle`, `university-notice`, `cafeteria`, `academic-calendar`이다(`notice`는 폐지). 대상이 있는 타입은 `cafeteria`(target = `cafeteria.id`)와 `university-notice`(target = `notice_category.id`, `department_id = 117`)이다.
- 잡 이름(`BatchJob.name`)은 `scrape_run.type`과 같다.
- 스케줄은 지금처럼 매시 정각 전체 순차 실행(`@Cron('0 0 * * * *')`)이다. 잡별 스케줄 분리는 하지 않는다.
- 예외를 삼키지 않는다. 실패는 던져서 `scrape_run`에 `failed`와 `error_message`로 남긴다.
- 삭제 후 삽입은 항상 한 트랜잭션이다.
- HTML 파싱은 `cheerio`를 쓴다. 셔틀 잡·파서는 바꾸지 않는다.
- 학사일정: `POST https://www.gnu.ac.kr/main/ps/schdul/selectSchdulList.do?mi=1084` (`schdulLevel=Y`, `srchYear`, `menuId=1084`, `sysId=main`), 올해와 내년 두 번 호출, 결과 0건이면 실패하고 기존 데이터를 유지한다.
- 학교 공지: 카테고리당 개수 제한 없이 누적한다. 30일 필터와 5건 제한은 폐지한다. `INSERT … ON CONFLICT (category_id, ntt_sn) DO NOTHING`.
- `POST /scrape-runs` 응답은 항상 `{ runs: ScrapeRun[] }`이다.
- 날짜 판단은 KST 기준이다(배치 서버는 UTC일 수 있다).
- 코드 스타일: 배치는 `services/api/batch/.prettierrc`(작은따옴표, trailing comma all), 앱·어드민은 루트 `.prettierrc`. 각 패키지에서 `pnpm lint`(배치·앱) 또는 `pnpm build`(어드민, tsc 포함)가 통과해야 한다.
- 커밋 메시지는 저장소 관례(gitmoji + 한글)를 따르고 끝에 `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`를 붙인다.

## Review Focus

- **식당(또는 게시판) 하나의 페이지가 깨졌을 때**: 그 대상의 run만 `failed`가 되고 같은 잡의 나머지 대상은 계속 수집된다 (Task 2, Task 8의 테스트).
- **학교 공지를 재실행했을 때**: 같은 글이 두 번 저장되지 않는다. 첫 실행(`last_ntt_sn = 0`)은 첫 페이지의 글을 모두 저장한다 (Task 1의 SQL 검증, Task 10의 job 테스트).
- **학사일정 응답이 이상할 때**(JSON이 아님, 표 없음, 0건): 실패로 기록하고 기존 `academic_calendar`를 지우지 않는다 (Task 5).
- **학사일정에 같은 (분류, 내용, 시작일)이 여러 번 나올 때**: `academic_calendar`의 `unique_calendar_type_content_start_date` 제약 위반으로 전체 교체가 롤백되지 않도록 잡에서 미리 중복 제거한다 (Task 5).
- **「전체 수집」 중 일부 대상만 이미 진행 중이거나 target이 잘못됐을 때**: 진행 중인 대상만 건너뛰고 나머지를 만들며, 모두 진행 중이면 409, 없는 대상이나 대상 없는 타입에 target을 주면 400이다 (Task 3).

## PR 경계

커밋은 Task 단위로 쌓는다. 스펙 7절의 PR 순서에 맞춰 나눌 때의 경계는 다음과 같다.

| PR | Task |
|---|---|
| 1. 마이그레이션 + `BatchService` + 어드민 API | 1, 2, 3 |
| 2. 학사일정 잡 | 4, 5 |
| 3. 학식 잡 | 6, 7 |
| 4. 학교 공지 잡 | 8, 9 |
| 5. 어드민 웹 UI | 10, 11 |
| (마무리) | 12 |

## File Structure

`services/api/batch/src/batch/` 기준:

| 파일 | 역할 |
|---|---|
| `utils/date.ts` (신규) | KST 날짜 문자열, KST 연도, 날짜 문자열 일수 더하기 |
| `jobs/batch-job.interface.ts` | `targets?()`, `run(target?)` 추가 |
| `scrape-run/domain/scrape-run.entity.ts` | `target` 컬럼 |
| `scrape-run/scrape-run.repository.ts` | `start(type, trigger, target)`, `claimPending`이 target 반환 |
| `batch.service.ts` | 대상별 run 생성·실행 |
| `jobs/academic-calendar/*` | 학사일정 client/parser/repository/job/entity |
| `jobs/cafeteria/*` | 학식 client/parser/repository/job/entity 2개 |
| `jobs/notice/*` | 공지 client/parser/repository/entity 2개, `university-notice.job.ts` (기존 `notice.job.ts` 대체) |
| `batch.module.ts` | 신규 provider·엔티티 등록 |

`services/api/app/src/api/admin/scrape-runs/` 기준: `domain/entities/scrape-run.entity.ts`, `infrastructure/scrape-run.repository.ts`, `infrastructure/scrape-targets.repository.ts`(신규), `application/scrape-runs.service.ts`, DTO들, `presentation/scrape-runs.controller.ts`, `scrape-runs.module.ts`.

`admin/src/` 기준: `api/types.ts`, `api/adminClient.ts`, `features/scrapers/{labels,searchParams,ScraperCard,RunTable,RunDetailPanel}.ts(x)`, `pages/{ScrapersPage,ScrapeRunsPage}.tsx`, `design/admin.css`, `test/fixtures.ts`.

---

## PR 1 — 마이그레이션, BatchService, 어드민 API

### Task 1: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/20260926000000_add_scrape_run_target.sql`

**Interfaces:**
- Produces: `scrape_run.target varchar(50) null`, 유니크 인덱스 `scrape_run_active_target_uq (type, coalesce(target, ''))`, 유니크 인덱스 `notice_category_ntt_sn_uq (category_id, ntt_sn)`, `type` 체크 제약(`notice` → `university-notice`).

- [ ] **Step 1: 마이그레이션 작성**

```sql
-- 대상(target)별 수집 run: 식당, 공지 게시판 등
alter table scrape_run add column target varchar(50);

-- 타입 이름 변경: notice -> university-notice (학과 공지는 나중에 department-notice로 추가)
alter table scrape_run drop constraint scrape_run_type_check;
update scrape_run set type = 'university-notice' where type = 'notice';
alter table scrape_run add constraint scrape_run_type_check
    check (type in ('shuttle', 'university-notice', 'cafeteria', 'academic-calendar'));

-- 활성 run 락을 (type, target) 단위로: 같은 대상은 하나만, 다른 대상은 병렬 가능
drop index scrape_run_active_type_uq;
create unique index scrape_run_active_target_uq
    on scrape_run (type, coalesce(target, ''))
    where status in ('pending', 'running');

drop index scrape_run_type_id_idx;
create index scrape_run_type_target_id_idx on scrape_run (type, target, id desc);

-- 공지는 카테고리당 무제한 누적하고 ON CONFLICT로 멱등하게 저장한다.
-- 기존 중복이 있으면 가장 오래된 id만 남긴다.
delete from notice a
    using notice b
    where a.category_id = b.category_id
      and a.ntt_sn = b.ntt_sn
      and a.id > b.id;
create unique index notice_category_ntt_sn_uq on notice (category_id, ntt_sn);
```

- [ ] **Step 2: 로컬 DB에 적용해 검증**

Run: `supabase db reset` (Docker 필요. 실패하면 이 단계를 건너뛰지 말고 원인을 보고한다)
Expected: 모든 마이그레이션이 오류 없이 적용된다.

Run:
```bash
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" <<'SQL'
insert into scrape_run (type, trigger, status, target) values ('cafeteria', 'cron', 'running', '1');
insert into scrape_run (type, trigger, status, target) values ('cafeteria', 'cron', 'running', '2');
insert into scrape_run (type, trigger, status) values ('shuttle', 'cron', 'running');
SQL
```
Expected: 세 건 모두 성공(대상이 다르면 병렬 가능).

Run:
```bash
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" -c "insert into scrape_run (type, trigger, status, target) values ('cafeteria', 'manual', 'pending', '1');"
```
Expected: `duplicate key value violates unique constraint "scrape_run_active_target_uq"`.

Run:
```bash
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" -c "insert into scrape_run (type, trigger, status) values ('notice', 'cron', 'running');"
```
Expected: `violates check constraint "scrape_run_type_check"`.

Run(공지 멱등 저장 확인):
```bash
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" <<'SQL'
insert into notice (category_id, title, ntt_sn) values (1, 'a', 10) on conflict (category_id, ntt_sn) do nothing;
insert into notice (category_id, title, ntt_sn) values (1, 'a', 10) on conflict (category_id, ntt_sn) do nothing;
select count(*) from notice where category_id = 1 and ntt_sn = 10;
SQL
```
Expected: `count = 1`. (`notice_category` 1번 행이 시드에 없으면 FK가 없어 그대로 통과한다. FK 오류가 나면 시드에 있는 `notice_category.id`로 바꿔 실행한다.)

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260926000000_add_scrape_run_target.sql
git commit -m "$(cat <<'EOF'
🗃️ db: scrape_run에 target 추가와 대상별 활성 run 락

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 배치 — `BatchJob`·`ScrapeRun`·`BatchService` 대상 지원

**Files:**
- Modify: `services/api/batch/src/batch/jobs/batch-job.interface.ts`
- Modify: `services/api/batch/src/batch/scrape-run/domain/scrape-run.entity.ts`
- Modify: `services/api/batch/src/batch/scrape-run/scrape-run.repository.ts`
- Modify: `services/api/batch/src/batch/batch.service.ts`
- Modify: `services/api/batch/src/batch/batch.service.spec.ts`

**Interfaces:**
- Produces:
  - `BatchJob { readonly name: string; targets?(): Promise<string[]>; run(target?: string): Promise<void> }`
  - `ScrapeRunRepository.start(type: string, trigger: ScrapeRunTrigger, target?: string | null): Promise<number | null>`
  - `ClaimedScrapeRun { id: number; type: string; target: string | null }`

- [ ] **Step 1: 실패하는 테스트 작성**

`batch.service.spec.ts`에서 먼저 기존 코드를 새 시그니처에 맞춘다.

```bash
cd services/api/batch
perl -pi -e "s/(\{ id: \d+, type: '[a-z-]+') \}/\$1, target: null }/g" src/batch/batch.service.spec.ts
perl -pi -e "s/toHaveBeenCalledWith\('shuttle', 'cron'\)/toHaveBeenCalledWith('shuttle', 'cron', null)/" src/batch/batch.service.spec.ts
```

`describe('run (cron)', …)` 블록의 마지막 `it` 뒤에 추가한다.

```ts
    it('대상이 있는 잡은 대상마다 run을 기록하고 target을 넘겨 실행한다', async () => {
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'cafeteria',
          targets: jest.fn().mockResolvedValue(['1', '2']),
          run: jobRun,
        },
      ]);

      await service.run();

      expect(repository.start).toHaveBeenNthCalledWith(1, 'cafeteria', 'cron', '1');
      expect(repository.start).toHaveBeenNthCalledWith(2, 'cafeteria', 'cron', '2');
      expect(jobRun).toHaveBeenNthCalledWith(1, '1');
      expect(jobRun).toHaveBeenNthCalledWith(2, '2');
      expect(repository.succeed).toHaveBeenCalledTimes(2);
    });

    it('한 대상이 실패해도 run을 실패 처리하고 나머지 대상을 계속 실행한다', async () => {
      const jobRun = jest
        .fn()
        .mockRejectedValueOnce(new Error('표 없음'))
        .mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'cafeteria',
          targets: jest.fn().mockResolvedValue(['1', '2', '3']),
          run: jobRun,
        },
      ]);

      await service.run();

      expect(jobRun).toHaveBeenCalledTimes(3);
      expect(repository.fail).toHaveBeenCalledWith(1, '표 없음');
      expect(repository.succeed).toHaveBeenCalledWith(2);
      expect(repository.succeed).toHaveBeenCalledWith(3);
    });

    it('이미 대기/실행 중인 대상은 건너뛰고 나머지 대상을 실행한다', async () => {
      repository.start.mockResolvedValueOnce(null);
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'cafeteria',
          targets: jest.fn().mockResolvedValue(['1', '2']),
          run: jobRun,
        },
      ]);

      await service.run();

      expect(jobRun).toHaveBeenCalledTimes(1);
      expect(jobRun).toHaveBeenCalledWith('2');
    });

    it('대상 목록 조회가 실패하면 그 잡만 건너뛰고 다음 잡을 실행한다', async () => {
      const nextRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        {
          name: 'cafeteria',
          targets: jest.fn().mockRejectedValue(new Error('db down')),
          run: jest.fn(),
        },
        { name: 'shuttle', run: nextRun },
      ]);

      await service.run();

      expect(nextRun).toHaveBeenCalledTimes(1);
      expect(repository.start).toHaveBeenCalledTimes(1);
      expect(repository.start).toHaveBeenCalledWith('shuttle', 'cron', null);
    });
```

`describe('runPending (수동 실행)', …)` 블록 안에 추가한다.

```ts
    it('target이 있는 대기 run은 target을 잡에 넘긴다', async () => {
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([
        { name: 'cafeteria', targets: jest.fn(), run: jobRun },
      ]);
      queuePending({ id: 20, type: 'cafeteria', target: '3' });

      await service.runPending();

      expect(jobRun).toHaveBeenCalledWith('3');
      expect(repository.succeed).toHaveBeenCalledWith(20);
    });

    it('target이 없는 대기 run은 target 없이 잡을 실행한다', async () => {
      const jobRun = jest.fn().mockResolvedValue(undefined);
      const service = createService([{ name: 'shuttle', run: jobRun }]);
      queuePending({ id: 21, type: 'shuttle', target: null });

      await service.runPending();

      expect(jobRun).toHaveBeenCalledWith(undefined);
    });
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --dir services/api/batch test -- batch.service.spec`
Expected: FAIL — `targets`가 `BatchJob`에 없다는 타입 오류(ts-jest diagnostics) 또는 `start` 호출 인자 불일치.

- [ ] **Step 3: 구현**

`jobs/batch-job.interface.ts`:

```ts
export const BATCH_JOBS = Symbol('BATCH_JOBS');

export interface BatchJob {
  /** scrape_run.type과 같다. */
  readonly name: string;

  /** 대상별로 run을 나누는 잡만 구현한다. 반환값이 scrape_run.target이 된다. */
  targets?(): Promise<string[]>;

  run(target?: string): Promise<void>;
}
```

`scrape-run/domain/scrape-run.entity.ts`에서 `type` 컬럼 뒤에 추가한다.

```ts
  @Column({ type: 'varchar', length: 50, nullable: true })
  target: string | null;
```

`scrape-run/scrape-run.repository.ts`를 다음처럼 바꾼다(`start`, `claimPending`, `ClaimedScrapeRun`만 변경).

```ts
export interface ClaimedScrapeRun {
  id: number;
  type: string;
  target: string | null;
}
```

```ts
  /**
   * 바로 실행 상태의 run을 만든다.
   * 같은 (타입, 대상)의 run이 이미 대기/실행 중이면 null을 반환한다.
   */
  async start(
    type: string,
    trigger: ScrapeRunTrigger,
    target: string | null = null,
  ): Promise<number | null> {
    try {
      const rows: { id: number }[] = await this.repository.query(
        `INSERT INTO scrape_run (type, trigger, target, status, started_at)
         VALUES ($1, $2, $3, 'running', now())
         RETURNING id`,
        [type, trigger, target],
      );
      return Number(rows[0].id);
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  /** 가장 오래된 대기 중 run 하나를 실행 상태로 바꾸고 반환한다. */
  async claimPending(): Promise<ClaimedScrapeRun | null> {
    const [rows]: [{ id: number; type: string; target: string | null }[], number] =
      await this.repository.query(
        `UPDATE scrape_run
         SET status = 'running', started_at = now()
         WHERE id = (
           SELECT id FROM scrape_run
           WHERE status = 'pending'
           ORDER BY id
           LIMIT 1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING id, type, target`,
      );
    if (!rows || rows.length === 0) return null;
    return {
      id: Number(rows[0].id),
      type: rows[0].type,
      target: rows[0].target ?? null,
    };
  }
```

`batch.service.ts`에서 `run()`, `runPending()`, `execute()`를 바꾼다.

```ts
  @Cron('0 0 * * * *') // 매 정각마다 실행
  async run(): Promise<void> {
    if (this.isRunning) {
      console.warn(
        `[${this.name}] 이전 작업이 아직 완료되지 않았습니다. 이번 실행을 건너뜁니다.`,
      );
      return;
    }

    this.isRunning = true;

    try {
      for (const job of this.jobs) {
        const targets = await this.resolveTargets(job);
        for (const target of targets) {
          await this.runScheduled(job, target);
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /** 대상이 없는 잡은 [null] 한 번, 대상 조회에 실패하면 [] (그 잡만 건너뜀). */
  private async resolveTargets(job: BatchJob): Promise<(string | null)[]> {
    if (!job.targets) return [null];

    try {
      return await job.targets();
    } catch (error) {
      console.error(`[${this.name}] 대상 조회 중 에러 발생: ${job.name}`, error);
      return [];
    }
  }

  private async runScheduled(job: BatchJob, target: string | null): Promise<void> {
    const label = target === null ? job.name : `${job.name}:${target}`;

    try {
      const runId = await this.scrapeRunRepository.start(job.name, 'cron', target);
      if (runId === null) {
        console.warn(
          `[${this.name}] 이미 대기/실행 중인 run이 있어 건너뜁니다: ${label}`,
        );
        return;
      }
      await this.execute(runId, job, target);
    } catch (error) {
      // TODO: 에러 로깅 및 알림 시스템 연동
      console.error(`[${this.name}] 잡 실행 중 에러 발생: ${label}`, error);
    }
  }
```

`runPending()` 안의 `await this.execute(claimed.id, job);`을 `await this.execute(claimed.id, job, claimed.target);`으로, `execute`를 다음으로 바꾼다.

```ts
  private async execute(
    runId: number,
    job: BatchJob,
    target: string | null,
  ): Promise<void> {
    try {
      await job.run(target ?? undefined);
    } catch (error) {
      await this.scrapeRunRepository.fail(runId, toErrorMessage(error));
      throw error;
    }
    await this.scrapeRunRepository.succeed(runId);
  }
```

`runPending()`의 `catch`에서 로그 문구는 그대로 둔다.

- [ ] **Step 4: 통과 확인**

Run: `pnpm --dir services/api/batch test -- batch.service.spec`
Expected: PASS (기존 + 신규 6건)

Run: `pnpm --dir services/api/batch test`
Expected: 전체 PASS

- [ ] **Step 5: 커밋**

```bash
git add services/api/batch/src/batch
git commit -m "$(cat <<'EOF'
✨ feat: 배치가 대상별로 scrape_run을 만들고 실행하도록 지원

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 어드민 API — `target` 지원

**Files:**
- Modify: `services/api/app/src/api/admin/scrape-runs/domain/entities/scrape-run.entity.ts`
- Create: `services/api/app/src/api/admin/scrape-runs/infrastructure/scrape-targets.repository.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/infrastructure/scrape-run.repository.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/application/scrape-runs.service.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/application/dtos/results/scraper-status-result.dto.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/presentation/dtos/requests/create-scrape-run-request.dto.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/presentation/dtos/requests/list-scrape-runs-query.dto.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/presentation/dtos/responses/scrape-run-response.dto.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/presentation/scrape-runs.controller.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/scrape-runs.module.ts`
- Modify: `services/api/app/src/api/admin/scrape-runs/application/scrape-runs.service.spec.ts`

**Interfaces:**
- Consumes: Task 1의 `scrape_run.target` 컬럼.
- Produces:
  - `SCRAPE_RUN_TYPES = ['shuttle', 'university-notice', 'cafeteria', 'academic-calendar']`, `ScrapeRun.target: string | null`
  - `ScrapeTarget { id: string; name: string }`, `ScrapeTargetsRepository.findByType(type): Promise<ScrapeTarget[] | null>`(대상 없는 타입은 `null`)
  - `ScrapeRunRepository.createPending(type, target?: string | null)`, `findLatestPerTarget()`, `findLastSucceededPerTarget()`, `findMany`의 `target` 조건
  - `ScrapeRunsService.requestRun(type, target?): Promise<ScrapeRun[]>`, `getTargetNames(runs): Promise<Map<string, string>>`, `targetKey(type, target): string`
  - 응답 JSON: `ScrapeRunResponseDto`에 `target: string | null`, `targetName: string | null`; `ScraperStatusResponseDto.targets: { target, targetName, latestRun, lastSucceededRun }[]`; `POST /admin/scrape-runs` 응답 `data = { runs: ScrapeRunResponseDto[] }`

- [ ] **Step 1: 실패하는 테스트 작성**

`scrape-runs.service.spec.ts`를 다음으로 통째로 교체한다.

```ts
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ScrapeRunsService, targetKey } from 'src/api/admin/scrape-runs/application/scrape-runs.service';
import { ScrapeRun } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { ScrapeRunRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-run.repository';
import { ScrapeTargetsRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-targets.repository';

function createRun(overrides: Partial<ScrapeRun>): ScrapeRun {
  return {
    id: 1,
    type: 'shuttle',
    target: null,
    trigger: 'cron',
    status: 'succeeded',
    errorMessage: null,
    createdAt: new Date('2026-09-25T00:00:00.000Z'),
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}

describe('ScrapeRunsService', () => {
  let repository: jest.Mocked<ScrapeRunRepository>;
  let targetsRepository: jest.Mocked<ScrapeTargetsRepository>;
  let service: ScrapeRunsService;

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findLatestPerType: jest.fn().mockResolvedValue([]),
      findLastSucceededPerType: jest.fn().mockResolvedValue([]),
      findLatestPerTarget: jest.fn().mockResolvedValue([]),
      findLastSucceededPerTarget: jest.fn().mockResolvedValue([]),
      createPending: jest.fn(),
    } as unknown as jest.Mocked<ScrapeRunRepository>;
    targetsRepository = {
      findByType: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<ScrapeTargetsRepository>;
    service = new ScrapeRunsService(repository, targetsRepository);
  });

  describe('getRuns', () => {
    it('limit보다 많이 조회되면 마지막 항목 id를 다음 커서로 반환한다', async () => {
      repository.findMany.mockResolvedValue([
        createRun({ id: 5 }),
        createRun({ id: 4 }),
        createRun({ id: 3 }),
      ]);

      const result = await service.getRuns({ type: 'shuttle', limit: 2 });

      expect(repository.findMany).toHaveBeenCalledWith({ type: 'shuttle', limit: 3 });
      expect(result.runs.map(run => run.id)).toEqual([5, 4]);
      expect(result.nextCursor).toBe(4);
    });

    it('마지막 페이지면 다음 커서가 null이다', async () => {
      repository.findMany.mockResolvedValue([createRun({ id: 1 })]);

      const result = await service.getRuns({ limit: 2 });

      expect(result.nextCursor).toBeNull();
    });
  });

  describe('getRun', () => {
    it('run이 없으면 NotFoundException을 던진다', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getRun(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestRun', () => {
    it('대상 없는 타입은 대기 상태의 수동 run 하나를 등록한다', async () => {
      const run = createRun({ id: 7, trigger: 'manual', status: 'pending' });
      repository.createPending.mockResolvedValue(run);

      await expect(service.requestRun('shuttle')).resolves.toEqual([run]);
      expect(repository.createPending).toHaveBeenCalledWith('shuttle', null);
    });

    it('대상 없는 타입이 이미 대기/실행 중이면 ConflictException을 던진다', async () => {
      repository.createPending.mockResolvedValue(null);

      await expect(service.requestRun('shuttle')).rejects.toThrow(ConflictException);
    });

    it('대상 없는 타입에 target을 주면 BadRequestException을 던진다', async () => {
      await expect(service.requestRun('shuttle', '1')).rejects.toThrow(BadRequestException);
      expect(repository.createPending).not.toHaveBeenCalled();
    });

    it('target을 지정하면 그 대상의 run 하나만 등록한다', async () => {
      targetsRepository.findByType.mockResolvedValue([
        { id: '1', name: '아람관' },
        { id: '2', name: '교육문화식당' },
      ]);
      const run = createRun({ id: 8, type: 'cafeteria', target: '2', status: 'pending' });
      repository.createPending.mockResolvedValue(run);

      await expect(service.requestRun('cafeteria', '2')).resolves.toEqual([run]);
      expect(repository.createPending).toHaveBeenCalledWith('cafeteria', '2');
    });

    it('목록에 없는 target이면 BadRequestException을 던진다', async () => {
      targetsRepository.findByType.mockResolvedValue([{ id: '1', name: '아람관' }]);

      await expect(service.requestRun('cafeteria', '99')).rejects.toThrow(BadRequestException);
      expect(repository.createPending).not.toHaveBeenCalled();
    });

    it('지정한 대상이 이미 대기/실행 중이면 ConflictException을 던진다', async () => {
      targetsRepository.findByType.mockResolvedValue([{ id: '1', name: '아람관' }]);
      repository.createPending.mockResolvedValue(null);

      await expect(service.requestRun('cafeteria', '1')).rejects.toThrow(ConflictException);
    });

    it('target 없이 요청하면 대상마다 run을 만들고 진행 중인 대상은 건너뛴다', async () => {
      targetsRepository.findByType.mockResolvedValue([
        { id: '1', name: '아람관' },
        { id: '2', name: '교육문화식당' },
        { id: '3', name: '가좌식당' },
      ]);
      const first = createRun({ id: 10, type: 'cafeteria', target: '1', status: 'pending' });
      const third = createRun({ id: 12, type: 'cafeteria', target: '3', status: 'pending' });
      repository.createPending
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(third);

      await expect(service.requestRun('cafeteria')).resolves.toEqual([first, third]);
    });

    it('target 없이 요청했는데 모든 대상이 진행 중이면 ConflictException을 던진다', async () => {
      targetsRepository.findByType.mockResolvedValue([{ id: '1', name: '아람관' }]);
      repository.createPending.mockResolvedValue(null);

      await expect(service.requestRun('cafeteria')).rejects.toThrow(ConflictException);
    });

    it('대상이 하나도 없으면 BadRequestException을 던진다', async () => {
      targetsRepository.findByType.mockResolvedValue([]);

      await expect(service.requestRun('cafeteria')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTargetNames', () => {
    it('run의 대상 id를 이름으로 바꿀 수 있는 맵을 만든다', async () => {
      targetsRepository.findByType.mockResolvedValue([
        { id: '1', name: '아람관' },
        { id: '2', name: '교육문화식당' },
      ]);

      const names = await service.getTargetNames([
        createRun({ id: 1, type: 'cafeteria', target: '1' }),
        createRun({ id: 2, type: 'shuttle', target: null }),
      ]);

      expect(names.get(targetKey('cafeteria', '1'))).toBe('아람관');
      expect(names.get(targetKey('cafeteria', '2'))).toBe('교육문화식당');
      expect(targetsRepository.findByType).toHaveBeenCalledTimes(1);
    });
  });

  describe('getScraperStatuses', () => {
    it('모든 수집 타입에 대해 최근 run과 최근 성공 run을 반환한다', async () => {
      const failedShuttle = createRun({ id: 3, status: 'failed' });
      const succeededShuttle = createRun({ id: 2 });
      repository.findLatestPerType.mockResolvedValue([failedShuttle]);
      repository.findLastSucceededPerType.mockResolvedValue([succeededShuttle]);

      const result = await service.getScraperStatuses();

      expect(result).toEqual([
        { type: 'shuttle', latestRun: failedShuttle, lastSucceededRun: succeededShuttle, targets: [] },
        { type: 'university-notice', latestRun: null, lastSucceededRun: null, targets: [] },
        { type: 'cafeteria', latestRun: null, lastSucceededRun: null, targets: [] },
        { type: 'academic-calendar', latestRun: null, lastSucceededRun: null, targets: [] },
      ]);
    });

    it('대상이 있는 타입은 대상별 최근 run을 함께 반환한다', async () => {
      targetsRepository.findByType.mockImplementation(async type =>
        type === 'cafeteria'
          ? [
              { id: '1', name: '아람관' },
              { id: '2', name: '교육문화식당' },
            ]
          : null,
      );
      const latestFirst = createRun({ id: 9, type: 'cafeteria', target: '1', status: 'failed' });
      const succeededFirst = createRun({ id: 7, type: 'cafeteria', target: '1' });
      repository.findLatestPerTarget.mockResolvedValue([latestFirst]);
      repository.findLastSucceededPerTarget.mockResolvedValue([succeededFirst]);

      const result = await service.getScraperStatuses();
      const cafeteria = result.find(status => status.type === 'cafeteria');

      expect(cafeteria?.targets).toEqual([
        { target: '1', targetName: '아람관', latestRun: latestFirst, lastSucceededRun: succeededFirst },
        { target: '2', targetName: '교육문화식당', latestRun: null, lastSucceededRun: null },
      ]);
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --dir services/api/app exec jest --runInBand src/api/admin/scrape-runs`
Expected: FAIL — `scrape-targets.repository`를 찾을 수 없음.

- [ ] **Step 3: 구현**

`domain/entities/scrape-run.entity.ts`:

```ts
export const SCRAPE_RUN_TYPES = [
  'shuttle',
  'university-notice',
  'cafeteria',
  'academic-calendar',
] as const;
```
`type` 컬럼 뒤에 추가:

```ts
  @Column({ type: 'varchar', length: 50, nullable: true })
  target: string | null;
```

`infrastructure/scrape-targets.repository.ts` (신규):

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScrapeRunType } from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { NoticeCategory } from 'src/api/public/notices/domain/entities/notice-category.entity';
import { Repository } from 'typeorm';

const UNIVERSITY_DEPARTMENT_ID = 117;

export interface ScrapeTarget {
  id: string;
  name: string;
}

@Injectable()
export class ScrapeTargetsRepository {
  constructor(
    @InjectRepository(Cafeteria)
    private readonly cafeteriaRepository: Repository<Cafeteria>,
    @InjectRepository(NoticeCategory)
    private readonly noticeCategoryRepository: Repository<NoticeCategory>,
  ) {}

  /** 수집 대상 목록. 대상 없이 도는 타입이면 null을 반환한다. */
  async findByType(type: ScrapeRunType): Promise<ScrapeTarget[] | null> {
    switch (type) {
      case 'cafeteria': {
        const cafeterias = await this.cafeteriaRepository.find({ order: { id: 'ASC' } });
        return cafeterias.map(cafeteria => ({ id: String(cafeteria.id), name: cafeteria.name }));
      }
      case 'university-notice': {
        const categories = await this.noticeCategoryRepository.find({
          where: { departmentId: UNIVERSITY_DEPARTMENT_ID },
          order: { id: 'ASC' },
        });
        return categories.map(category => ({ id: String(category.id), name: category.category }));
      }
      default:
        return null;
    }
  }
}
```

`infrastructure/scrape-run.repository.ts` 변경:

```ts
export interface ScrapeRunSearchCondition {
  type?: ScrapeRunType;
  target?: string;
  status?: ScrapeRunStatus;
  cursor?: number;
  limit: number;
}
```
`findMany`:

```ts
  findMany({ type, target, status, cursor, limit }: ScrapeRunSearchCondition): Promise<ScrapeRun[]> {
    const where: FindOptionsWhere<ScrapeRun> = {};
    if (type) where.type = type;
    if (target) where.target = target;
    if (status) where.status = status;
    if (cursor) where.id = LessThan(cursor);

    return this.scrapeRunRepository.find({ where, order: { id: 'DESC' }, take: limit });
  }
```
`findLastSucceededPerType` 뒤에 추가:

```ts
  /** (타입, 대상)별 가장 최근 run. 대상 없는 run은 제외한다. */
  findLatestPerTarget(): Promise<ScrapeRun[]> {
    return this.scrapeRunRepository
      .createQueryBuilder('run')
      .distinctOn(['run.type', 'run.target'])
      .where('run.target IS NOT NULL')
      .orderBy('run.type')
      .addOrderBy('run.target')
      .addOrderBy('run.id', 'DESC')
      .getMany();
  }

  /** (타입, 대상)별 가장 최근 성공 run. 대상 없는 run은 제외한다. */
  findLastSucceededPerTarget(): Promise<ScrapeRun[]> {
    return this.scrapeRunRepository
      .createQueryBuilder('run')
      .distinctOn(['run.type', 'run.target'])
      .where('run.target IS NOT NULL')
      .andWhere('run.status = :status', { status: 'succeeded' })
      .orderBy('run.type')
      .addOrderBy('run.target')
      .addOrderBy('run.id', 'DESC')
      .getMany();
  }
```
`createPending`를 바꾼다:

```ts
  /**
   * 수동 실행 요청을 대기 상태로 등록한다.
   * 같은 (타입, 대상)의 run이 이미 대기/실행 중이면 null을 반환한다.
   */
  async createPending(
    type: ScrapeRunType,
    target: string | null = null,
  ): Promise<ScrapeRun | null> {
    try {
      const run = this.scrapeRunRepository.create({
        type,
        target,
        trigger: 'manual',
        status: 'pending',
      });
      const { id } = await this.scrapeRunRepository.save(run);
      return this.findById(id);
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }
```

`application/dtos/results/scraper-status-result.dto.ts`:

```ts
import {
  ScrapeRun,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';

export interface ScraperTargetStatusResult {
  target: string;
  targetName: string;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
}

export interface ScraperStatusResult {
  type: ScrapeRunType;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
  /** 대상 없이 도는 타입은 빈 배열 */
  targets: ScraperTargetStatusResult[];
}

export interface ScrapeRunListResult {
  runs: ScrapeRun[];
  nextCursor: number | null;
}
```

`application/scrape-runs.service.ts`를 다음으로 교체한다.

```ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ScrapeRunListResult,
  ScraperStatusResult,
} from 'src/api/admin/scrape-runs/application/dtos/results/scraper-status-result.dto';
import {
  SCRAPE_RUN_TYPES,
  ScrapeRun,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';
import {
  ScrapeRunRepository,
  ScrapeRunSearchCondition,
} from 'src/api/admin/scrape-runs/infrastructure/scrape-run.repository';
import { ScrapeTargetsRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-targets.repository';

export function targetKey(type: ScrapeRunType, target: string): string {
  return `${type}:${target}`;
}

@Injectable()
export class ScrapeRunsService {
  constructor(
    private readonly scrapeRunRepository: ScrapeRunRepository,
    private readonly scrapeTargetsRepository: ScrapeTargetsRepository,
  ) {}

  public async getRuns(condition: ScrapeRunSearchCondition): Promise<ScrapeRunListResult> {
    // 다음 페이지 존재 여부 확인을 위해 하나 더 조회한다
    const runs = await this.scrapeRunRepository.findMany({
      ...condition,
      limit: condition.limit + 1,
    });
    const hasNext = runs.length > condition.limit;
    const page = hasNext ? runs.slice(0, condition.limit) : runs;

    return {
      runs: page,
      nextCursor: hasNext ? Number(page[page.length - 1].id) : null,
    };
  }

  public async getRun(id: number): Promise<ScrapeRun> {
    const run = await this.scrapeRunRepository.findById(id);
    if (!run) {
      throw new NotFoundException(`${id}번 수집 실행 기록을 찾을 수 없습니다.`);
    }
    return run;
  }

  /**
   * 수동 실행을 대기열에 등록한다.
   * - 대상 없는 타입: run 하나
   * - 대상 있는 타입 + target: 그 대상의 run 하나
   * - 대상 있는 타입 + target 없음: 대상마다 run 하나(진행 중인 대상은 건너뜀)
   */
  public async requestRun(type: ScrapeRunType, target?: string): Promise<ScrapeRun[]> {
    const targets = await this.scrapeTargetsRepository.findByType(type);

    if (targets === null) {
      if (target !== undefined) {
        throw new BadRequestException(`'${type}' 수집은 대상을 지정할 수 없습니다.`);
      }
      return [await this.createPendingOrConflict(type, null)];
    }

    if (target !== undefined) {
      if (!targets.some(item => item.id === target)) {
        throw new BadRequestException(`'${type}' 수집에 '${target}' 대상이 없습니다.`);
      }
      return [await this.createPendingOrConflict(type, target)];
    }

    if (targets.length === 0) {
      throw new BadRequestException(`'${type}' 수집 대상이 없습니다.`);
    }

    const runs: ScrapeRun[] = [];
    for (const item of targets) {
      const run = await this.scrapeRunRepository.createPending(type, item.id);
      if (run) runs.push(run);
    }
    if (runs.length === 0) {
      throw new ConflictException(`'${type}' 수집이 모든 대상에서 이미 대기 또는 실행 중입니다.`);
    }
    return runs;
  }

  /** run 목록의 대상 id를 이름으로 바꾸기 위한 맵. 키는 targetKey(type, target). */
  public async getTargetNames(runs: ScrapeRun[]): Promise<Map<string, string>> {
    const types = [...new Set(runs.filter(run => run.target !== null).map(run => run.type))];
    const found = await Promise.all(
      types.map(async type => [type, await this.scrapeTargetsRepository.findByType(type)] as const),
    );

    const names = new Map<string, string>();
    for (const [type, targets] of found) {
      for (const item of targets ?? []) names.set(targetKey(type, item.id), item.name);
    }
    return names;
  }

  public async getScraperStatuses(): Promise<ScraperStatusResult[]> {
    const [latestRuns, succeededRuns, latestTargetRuns, succeededTargetRuns] = await Promise.all([
      this.scrapeRunRepository.findLatestPerType(),
      this.scrapeRunRepository.findLastSucceededPerType(),
      this.scrapeRunRepository.findLatestPerTarget(),
      this.scrapeRunRepository.findLastSucceededPerTarget(),
    ]);

    return Promise.all(
      SCRAPE_RUN_TYPES.map(async type => {
        const targets = await this.scrapeTargetsRepository.findByType(type);
        return {
          type,
          latestRun: latestRuns.find(run => run.type === type) ?? null,
          lastSucceededRun: succeededRuns.find(run => run.type === type) ?? null,
          targets: (targets ?? []).map(item => ({
            target: item.id,
            targetName: item.name,
            latestRun:
              latestTargetRuns.find(run => run.type === type && run.target === item.id) ?? null,
            lastSucceededRun:
              succeededTargetRuns.find(run => run.type === type && run.target === item.id) ?? null,
          })),
        };
      }),
    );
  }

  private async createPendingOrConflict(
    type: ScrapeRunType,
    target: string | null,
  ): Promise<ScrapeRun> {
    const run = await this.scrapeRunRepository.createPending(type, target);
    if (!run) {
      const label = target === null ? type : `${type}:${target}`;
      throw new ConflictException(`'${label}' 수집이 이미 대기 또는 실행 중입니다.`);
    }
    return run;
  }
}
```

`presentation/dtos/requests/create-scrape-run-request.dto.ts`:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  SCRAPE_RUN_TYPES,
  ScrapeRunType,
} from 'src/api/admin/scrape-runs/domain/entities/scrape-run.entity';

export class CreateScrapeRunRequestDto {
  @IsIn(SCRAPE_RUN_TYPES)
  @ApiProperty({ description: '수집 타입', enum: SCRAPE_RUN_TYPES, example: 'cafeteria' })
  type: ScrapeRunType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional({
    description: '수집 대상(식당 id, 공지 카테고리 id). 없으면 타입 전체(대상마다 run 생성)',
    example: '1',
  })
  target?: string;
}
```

`presentation/dtos/requests/list-scrape-runs-query.dto.ts`에 `type` 필드 뒤에 추가하고 import에 `IsString`, `MaxLength`를 넣는다.

```ts
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional({ description: '수집 대상(식당 id, 공지 카테고리 id)' })
  target?: string;
```

`presentation/dtos/responses/scrape-run-response.dto.ts`:

```ts
export class ScrapeRunResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: SCRAPE_RUN_TYPES })
  type: ScrapeRunType;

  @ApiProperty({ nullable: true, type: String, description: '수집 대상 id. 대상 없는 타입은 null' })
  target: string | null;

  @ApiProperty({ nullable: true, type: String, description: '수집 대상 이름(식당명, 카테고리명)' })
  targetName: string | null;

  // trigger, status, errorMessage, createdAt, startedAt, finishedAt 필드는 그대로

  static from(run: ScrapeRun, targetName: string | null = null): ScrapeRunResponseDto {
    return {
      id: Number(run.id),
      type: run.type,
      target: run.target,
      targetName,
      trigger: run.trigger,
      status: run.status,
      errorMessage: run.errorMessage,
      createdAt: run.createdAt.toISOString(),
      startedAt: run.startedAt?.toISOString() ?? null,
      finishedAt: run.finishedAt?.toISOString() ?? null,
    };
  }
}
```
파일 끝의 `ScraperStatusResponseDto`를 다음으로 교체하고 `CreateScrapeRunResponseDto`를 추가한다.

```ts
export class ScraperTargetStatusResponseDto {
  @ApiProperty({ example: '1' })
  target: string;

  @ApiProperty({ example: '아람관' })
  targetName: string;

  @ApiProperty({ nullable: true, type: ScrapeRunResponseDto })
  latestRun: ScrapeRunResponseDto | null;

  @ApiProperty({ nullable: true, type: ScrapeRunResponseDto })
  lastSucceededRun: ScrapeRunResponseDto | null;
}

export class ScraperStatusResponseDto {
  @ApiProperty({ enum: SCRAPE_RUN_TYPES })
  type: ScrapeRunType;

  @ApiProperty({ nullable: true, type: ScrapeRunResponseDto })
  latestRun: ScrapeRunResponseDto | null;

  @ApiProperty({ nullable: true, type: ScrapeRunResponseDto })
  lastSucceededRun: ScrapeRunResponseDto | null;

  @ApiProperty({
    type: [ScraperTargetStatusResponseDto],
    description: '대상별 상태. 대상 없이 도는 타입은 빈 배열',
  })
  targets: ScraperTargetStatusResponseDto[];
}

export class CreateScrapeRunResponseDto {
  @ApiProperty({ type: [ScrapeRunResponseDto], description: '대기열에 등록된 run들' })
  runs: ScrapeRunResponseDto[];
}
```

`presentation/scrape-runs.controller.ts`를 다음으로 바꾼다(`import`에 `targetKey`, `CreateScrapeRunResponseDto` 추가; `.map(ScrapeRunResponseDto.from)`처럼 함수를 직접 넘기던 부분은 두 번째 인자가 인덱스로 들어가므로 반드시 람다를 쓴다).

```ts
  @Get('scrapers')
  @ApiOkResponse({ type: NativeResponseDto<ScraperStatusResponseDto[]> })
  async getScraperStatuses(): Promise<NativeResponseDto<ScraperStatusResponseDto[]>> {
    const statuses = await this.scrapeRunsService.getScraperStatuses();
    const data = statuses.map(status => ({
      type: status.type,
      latestRun: status.latestRun && ScrapeRunResponseDto.from(status.latestRun),
      lastSucceededRun:
        status.lastSucceededRun && ScrapeRunResponseDto.from(status.lastSucceededRun),
      targets: status.targets.map(item => ({
        target: item.target,
        targetName: item.targetName,
        latestRun:
          item.latestRun && ScrapeRunResponseDto.from(item.latestRun, item.targetName),
        lastSucceededRun:
          item.lastSucceededRun &&
          ScrapeRunResponseDto.from(item.lastSucceededRun, item.targetName),
      })),
    }));
    return new NativeResponseDto(data);
  }

  @Get('scrape-runs')
  @ApiOkResponse({ type: NativeResponseDto<ScrapeRunListResponseDto> })
  async getRuns(
    @Query() query: ListScrapeRunsQueryDto,
  ): Promise<NativeResponseDto<ScrapeRunListResponseDto>> {
    const result = await this.scrapeRunsService.getRuns({
      type: query.type,
      target: query.target,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
    });
    const names = await this.scrapeRunsService.getTargetNames(result.runs);
    return new NativeResponseDto({
      items: result.runs.map(run =>
        ScrapeRunResponseDto.from(run, this.nameOf(names, run)),
      ),
      nextCursor: result.nextCursor,
    });
  }

  @Get('scrape-runs/:id')
  @ApiOkResponse({ type: NativeResponseDto<ScrapeRunResponseDto> })
  async getRun(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NativeResponseDto<ScrapeRunResponseDto>> {
    const run = await this.scrapeRunsService.getRun(id);
    const names = await this.scrapeRunsService.getTargetNames([run]);
    return new NativeResponseDto(ScrapeRunResponseDto.from(run, this.nameOf(names, run)));
  }

  @Post('scrape-runs')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({
    type: NativeResponseDto<CreateScrapeRunResponseDto>,
    description: '수집 요청이 대기열에 등록됨. 배치가 폴링해 실행한다',
  })
  async requestRun(
    @Body() body: CreateScrapeRunRequestDto,
  ): Promise<NativeResponseDto<CreateScrapeRunResponseDto>> {
    const runs = await this.scrapeRunsService.requestRun(body.type, body.target);
    const names = await this.scrapeRunsService.getTargetNames(runs);
    return new NativeResponseDto(
      { runs: runs.map(run => ScrapeRunResponseDto.from(run, this.nameOf(names, run))) },
      'Accepted',
      HttpStatus.ACCEPTED,
    );
  }

  private nameOf(names: Map<string, string>, run: ScrapeRun): string | null {
    return run.target === null ? null : (names.get(targetKey(run.type, run.target)) ?? null);
  }
```
(컨트롤러 import에 `ScrapeRun`(entity)와 `targetKey`를 추가한다.)

`scrape-runs.module.ts`:

```ts
import { Cafeteria } from 'src/api/public/cafeterias/domain/entities/cafeteria.entity';
import { NoticeCategory } from 'src/api/public/notices/domain/entities/notice-category.entity';
import { ScrapeTargetsRepository } from 'src/api/admin/scrape-runs/infrastructure/scrape-targets.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapeRun, Cafeteria, NoticeCategory])],
  controllers: [ScrapeRunsController],
  providers: [ScrapeRunsService, ScrapeRunRepository, ScrapeTargetsRepository, AdminApiKeyGuard],
})
export class ScrapeRunsModule {}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm --dir services/api/app exec jest --runInBand src/api/admin/scrape-runs`
Expected: PASS

Run: `pnpm --dir services/api/app lint:check && pnpm --dir services/api/app build`
Expected: 오류 없음 (`lint:check`가 포맷 문제를 지적하면 `pnpm --dir services/api/app lint`로 고친다)

- [ ] **Step 5: 커밋**

```bash
git add services/api/app/src/api/admin/scrape-runs
git commit -m "$(cat <<'EOF'
✨ feat: 어드민 API가 수집 대상(target)별 실행과 상태를 지원

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## PR 2 — 학사일정 잡

### Task 4: `cheerio` 추가와 KST 날짜 유틸

**Files:**
- Modify: `services/api/batch/package.json`, `services/api/batch/pnpm-lock.yaml`
- Create: `services/api/batch/src/batch/utils/date.ts`
- Test: `services/api/batch/src/batch/utils/date.spec.ts`

**Interfaces:**
- Produces: `toKstDateString(date: Date): string`(`YYYY-MM-DD`), `toKstYear(date: Date): number`, `addDays(dateString: string, days: number): string`

- [ ] **Step 1: 의존성 설치**

Run:
```bash
pnpm --dir services/api/batch add cheerio
pnpm --dir services/api/batch add -D domhandler
```
Expected: `package.json`의 dependencies에 `cheerio`(1.x), devDependencies에 `domhandler`가 추가되고 lockfile이 갱신된다. (`domhandler`는 cheerio가 쓰는 노드 타입(`AnyNode`)을 파서에서 가져오기 위한 것이다. pnpm은 간접 의존성을 직접 import하지 못하게 하므로 명시한다.)

- [ ] **Step 2: 실패하는 테스트 작성** (`utils/date.spec.ts`)

```ts
import { addDays, toKstDateString, toKstYear } from './date';

describe('date utils', () => {
  it('UTC 시각을 KST 날짜로 바꾼다', () => {
    expect(toKstDateString(new Date('2026-09-25T15:30:00Z'))).toBe('2026-09-26');
    expect(toKstDateString(new Date('2026-09-25T14:59:59Z'))).toBe('2026-09-25');
  });

  it('연도 경계에서도 KST 기준 연도를 돌려준다', () => {
    expect(toKstYear(new Date('2026-12-31T16:00:00Z'))).toBe(2027);
    expect(toKstYear(new Date('2026-12-31T14:00:00Z'))).toBe(2026);
  });

  it('날짜 문자열에 일수를 더하고 뺀다', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm --dir services/api/batch test -- date.spec`
Expected: FAIL — `./date`를 찾을 수 없음.

- [ ] **Step 4: 구현** (`utils/date.ts`)

```ts
const KST = 'Asia/Seoul';

const kstDateFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: KST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 시각을 KST 기준 YYYY-MM-DD로 바꾼다. 배치 서버가 UTC여도 같은 결과가 나온다. */
export function toKstDateString(date: Date): string {
  return kstDateFormat.format(date);
}

export function toKstYear(date: Date): number {
  return Number(toKstDateString(date).slice(0, 4));
}

/** YYYY-MM-DD 문자열에 일수를 더한다(음수 가능). */
export function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
```

- [ ] **Step 5: 통과 확인 후 커밋**

Run: `pnpm --dir services/api/batch test -- date.spec`
Expected: PASS

```bash
git add services/api/batch/package.json services/api/batch/pnpm-lock.yaml services/api/batch/src/batch/utils
git commit -m "$(cat <<'EOF'
✨ feat: cheerio 의존성과 KST 날짜 유틸 추가

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 학사일정 잡

**Files:**
- Create: `services/api/batch/src/batch/jobs/academic-calendar/domain/academic-calendar.entity.ts`
- Create: `services/api/batch/src/batch/jobs/academic-calendar/type/parsed-academic-schedule.ts`
- Create: `services/api/batch/src/batch/jobs/academic-calendar/__fixtures__/schedule-response.ts`
- Create: `services/api/batch/src/batch/jobs/academic-calendar/academic-calendar.client.ts` (+ `.spec.ts`)
- Create: `services/api/batch/src/batch/jobs/academic-calendar/academic-calendar.parser.ts` (+ `.spec.ts`)
- Create: `services/api/batch/src/batch/jobs/academic-calendar/academic-calendar.repository.ts` (+ `.spec.ts`)
- Modify: `services/api/batch/src/batch/jobs/academic-calendar/academic-calendar.job.ts` (+ 신규 `.spec.ts`)
- Modify: `services/api/batch/src/batch/batch.module.ts`

**Interfaces:**
- Consumes: `FetchHttpClient.getText(url, options)`, `toKstDateString`, `toKstYear`, `addDays`(Task 4), `BatchJob`(Task 2)
- Produces:
  - `ParsedAcademicSchedule { calendarType: 1 | 2; startDate: string; endDate: string; content: string }`
  - `AcademicCalendarClient.fetchYear(year: number): Promise<string>`
  - `AcademicCalendarParser.parse(raw: string): ParsedAcademicSchedule[]`
  - `AcademicCalendarRepository.replaceAll(schedules: ParsedAcademicSchedule[]): Promise<void>`

- [ ] **Step 1: 타입·엔티티·테스트 fixture 작성**

`type/parsed-academic-schedule.ts`:

```ts
export interface ParsedAcademicSchedule {
  /** 1: 학부, 2: 그 외(대학원 등) */
  calendarType: 1 | 2;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  content: string;
}
```

`domain/academic-calendar.entity.ts`:

```ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('academic_calendar')
export class AcademicCalendar {
  @PrimaryGeneratedColumn({ name: 'academic_id' })
  academicId: number;

  @Column({ name: 'calendar_type', type: 'smallint' })
  calendarType: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'text' })
  content: string;
}
```

`__fixtures__/schedule-response.ts` (실제 응답과 같은 형태로, JSON 문자열로 감싼 HTML을 만든다):

```ts
/** [시작, 종료, "[분류] 내용"] 목록을 selectSchdulList.do 응답 형태(JSON 문자열로 감싼 HTML)로 만든다. */
export function scheduleResponse(
  items: Array<[start: string, end: string, label: string]>,
): string {
  const rows = items
    .map(
      ([start, end, label], index) =>
        `<tr><td class="nowrap"><span>${start}</span> ~ <span>${end}</span></td>` +
        `<td><a href="javascript:viewSchdulInfo('${1000 + index}', '${start}', '${end}', '#CBD3E7');">${label}</a></td></tr>`,
    )
    .join('\n');

  return JSON.stringify(
    `<div class='tbl_tbody_year'><table><tbody>${rows}</tbody></table></div>`,
  );
}
```

- [ ] **Step 2: 파서 — 실패하는 테스트 작성** (`academic-calendar.parser.spec.ts`)

```ts
import { scheduleResponse } from './__fixtures__/schedule-response';
import { AcademicCalendarParser } from './academic-calendar.parser';

describe('AcademicCalendarParser', () => {
  const parser = new AcademicCalendarParser();

  it('링크에서 기간과 분류, 내용을 뽑는다', () => {
    const raw = scheduleResponse([
      ['2026/12/22', '2027/02/28', '[학부] 2학기 동계방학'],
      ['2026/12/22', '2027/02/28', '[대학원] 2학기 동계방학'],
    ]);

    expect(parser.parse(raw)).toEqual([
      { calendarType: 1, startDate: '2026-12-22', endDate: '2027-02-28', content: '2학기 동계방학' },
      { calendarType: 2, startDate: '2026-12-22', endDate: '2027-02-28', content: '2학기 동계방학' },
    ]);
  });

  it('분류 표기가 없는 항목은 건너뛴다', () => {
    const raw = scheduleResponse([
      ['2026/10/01', '2026/10/01', '분류 없는 일정'],
      ['2026/10/02', '2026/10/02', '[학부] 개천절 대체'],
    ]);

    expect(parser.parse(raw)).toHaveLength(1);
  });

  it('일정이 없는 표는 빈 배열이다', () => {
    expect(parser.parse(scheduleResponse([]))).toEqual([]);
  });

  it('JSON 문자열이 아닌 응답이면 에러를 던진다', () => {
    expect(() => parser.parse('<html>점검 중</html>')).toThrow();
    expect(() => parser.parse('{"a":1}')).toThrow('학사일정 응답 형식');
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm --dir services/api/batch test -- academic-calendar.parser`
Expected: FAIL — 모듈 없음.

- [ ] **Step 4: 파서 구현** (`academic-calendar.parser.ts`)

```ts
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { ParsedAcademicSchedule } from './type/parsed-academic-schedule';

const SCHEDULE_HREF_PATTERN =
  /viewSchdulInfo\('[^']*',\s*'(\d{4}\/\d{2}\/\d{2})',\s*'(\d{4}\/\d{2}\/\d{2})'/;
const LABEL_PATTERN = /^\[([^\]]*)\]\s*([\s\S]*)$/;

@Injectable()
export class AcademicCalendarParser {
  /** selectSchdulList.do 응답(JSON 문자열로 감싼 HTML)을 일정 목록으로 바꾼다. */
  parse(raw: string): ParsedAcademicSchedule[] {
    const html: unknown = JSON.parse(raw);
    if (typeof html !== 'string') {
      throw new Error('학사일정 응답 형식이 올바르지 않습니다.');
    }

    const $ = cheerio.load(html);
    const schedules: ParsedAcademicSchedule[] = [];

    $('a').each((_, anchor) => {
      const href = $(anchor).attr('href') ?? '';
      const dates = SCHEDULE_HREF_PATTERN.exec(href);
      const label = LABEL_PATTERN.exec($(anchor).text().trim());
      if (!dates || !label) return;

      const content = label[2].trim();
      if (!content) return;

      schedules.push({
        calendarType: label[1].trim() === '학부' ? 1 : 2,
        startDate: dates[1].replaceAll('/', '-'),
        endDate: dates[2].replaceAll('/', '-'),
        content,
      });
    });

    return schedules;
  }
}
```

- [ ] **Step 5: 클라이언트 — 테스트 작성과 구현**

`academic-calendar.client.spec.ts`:

```ts
import { FetchHttpClient } from '../../http/fetch-http.client';
import { AcademicCalendarClient } from './academic-calendar.client';

describe('AcademicCalendarClient', () => {
  it('연도를 form 바디에 담아 학사일정 목록을 POST로 요청한다', async () => {
    const getText = jest.fn().mockResolvedValue('"<div></div>"');
    const client = new AcademicCalendarClient({ getText } as unknown as FetchHttpClient);

    await expect(client.fetchYear(2027)).resolves.toBe('"<div></div>"');

    const [url, options] = getText.mock.calls[0];
    expect(url).toBe('https://www.gnu.ac.kr/main/ps/schdul/selectSchdulList.do?mi=1084');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(String(options.body)).toBe('schdulLevel=Y&srchYear=2027&menuId=1084&sysId=main');
  });
});
```

`academic-calendar.client.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { FetchHttpClient } from '../../http/fetch-http.client';

const SCHEDULE_LIST_URL =
  'https://www.gnu.ac.kr/main/ps/schdul/selectSchdulList.do?mi=1084';
const MENU_ID = '1084';

@Injectable()
export class AcademicCalendarClient {
  constructor(private readonly httpClient: FetchHttpClient) {}

  /**
   * 학사일정 페이지가 표를 채울 때 부르는 AJAX 엔드포인트를 직접 호출한다.
   * 메인 페이지를 GET하면 빈 컨테이너만 오고 데이터는 이 응답에 있다.
   */
  async fetchYear(year: number): Promise<string> {
    const body = new URLSearchParams({
      schdulLevel: 'Y',
      srchYear: String(year),
      menuId: MENU_ID,
      sysId: 'main',
    });

    return this.httpClient.getText(SCHEDULE_LIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  }
}
```

- [ ] **Step 6: 저장소 — 테스트 작성과 구현**

`academic-calendar.repository.spec.ts`:

```ts
import { DataSource } from 'typeorm';
import { AcademicCalendarRepository } from './academic-calendar.repository';
import { AcademicCalendar } from './domain/academic-calendar.entity';

describe('AcademicCalendarRepository', () => {
  it('한 트랜잭션에서 전체 삭제 후 삽입한다', async () => {
    const calls: string[] = [];
    const manager = {
      query: jest.fn(async () => void calls.push('delete')),
      insert: jest.fn(async () => void calls.push('insert')),
    };
    const dataSource = {
      transaction: jest.fn(async (work: (m: typeof manager) => Promise<void>) => work(manager)),
    };
    const repository = new AcademicCalendarRepository(dataSource as unknown as DataSource);

    await repository.replaceAll([
      { calendarType: 1, startDate: '2026-10-01', endDate: '2026-10-02', content: '중간고사' },
    ]);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['delete', 'insert']);
    expect(manager.query).toHaveBeenCalledWith('DELETE FROM academic_calendar');
    expect(manager.insert).toHaveBeenCalledWith(AcademicCalendar, [
      { calendarType: 1, startDate: '2026-10-01', endDate: '2026-10-02', content: '중간고사' },
    ]);
  });
});
```

`academic-calendar.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AcademicCalendar } from './domain/academic-calendar.entity';
import type { ParsedAcademicSchedule } from './type/parsed-academic-schedule';

@Injectable()
export class AcademicCalendarRepository {
  constructor(private readonly dataSource: DataSource) {}

  /** 학사일정 전체를 교체한다. 삽입이 실패하면 삭제도 롤백된다. */
  async replaceAll(schedules: ParsedAcademicSchedule[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM academic_calendar');
      await manager.insert(
        AcademicCalendar,
        schedules.map(({ calendarType, startDate, endDate, content }) => ({
          calendarType,
          startDate,
          endDate,
          content,
        })),
      );
    });
  }
}
```

- [ ] **Step 7: 잡 — 실패하는 테스트 작성** (`academic-calendar.job.spec.ts`)

```ts
import { scheduleResponse } from './__fixtures__/schedule-response';
import { AcademicCalendarClient } from './academic-calendar.client';
import { AcademicCalendarJob } from './academic-calendar.job';
import { AcademicCalendarParser } from './academic-calendar.parser';
import { AcademicCalendarRepository } from './academic-calendar.repository';

describe('AcademicCalendarJob', () => {
  let fetchYear: jest.Mock;
  let replaceAll: jest.Mock;
  let job: AcademicCalendarJob;

  beforeEach(() => {
    // 2026-09-26 12:00 KST
    jest.useFakeTimers().setSystemTime(new Date('2026-09-26T03:00:00Z'));
    fetchYear = jest.fn();
    replaceAll = jest.fn().mockResolvedValue(undefined);
    job = new AcademicCalendarJob(
      { fetchYear } as unknown as AcademicCalendarClient,
      new AcademicCalendarParser(),
      { replaceAll } as unknown as AcademicCalendarRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('올해와 내년을 수집해 하나로 합쳐 저장한다', async () => {
    fetchYear.mockImplementation(async (year: number) =>
      year === 2026
        ? scheduleResponse([['2026/10/20', '2026/10/24', '[학부] 중간고사']])
        : scheduleResponse([['2027/03/02', '2027/03/02', '[학부] 개강']]),
    );

    await job.run();

    expect(fetchYear).toHaveBeenNthCalledWith(1, 2026);
    expect(fetchYear).toHaveBeenNthCalledWith(2, 2027);
    expect(replaceAll).toHaveBeenCalledWith([
      { calendarType: 1, startDate: '2026-10-20', endDate: '2026-10-24', content: '중간고사' },
      { calendarType: 1, startDate: '2027-03-02', endDate: '2027-03-02', content: '개강' },
    ]);
  });

  it('종료일이 오늘 이전인 일정은 저장하지 않는다', async () => {
    fetchYear.mockResolvedValue(
      scheduleResponse([
        ['2026/09/01', '2026/09/25', '[학부] 어제 끝난 일정'],
        ['2026/09/20', '2026/09/26', '[학부] 오늘 끝나는 일정'],
      ]),
    );

    await job.run();

    expect(replaceAll).toHaveBeenCalledWith([
      { calendarType: 1, startDate: '2026-09-20', endDate: '2026-09-26', content: '오늘 끝나는 일정' },
    ]);
  });

  it('두 해의 응답에 겹쳐 나온 일정과 같은 (분류, 내용, 시작일) 일정은 한 번만 저장한다', async () => {
    fetchYear.mockResolvedValue(
      scheduleResponse([
        ['2026/12/22', '2027/02/28', '[학부] 2학기 동계방학'],
        ['2026/12/22', '2027/03/01', '[학부] 2학기 동계방학'],
      ]),
    );

    await job.run();

    expect(replaceAll).toHaveBeenCalledTimes(1);
    expect(replaceAll.mock.calls[0][0]).toEqual([
      { calendarType: 1, startDate: '2026-12-22', endDate: '2027-02-28', content: '2학기 동계방학' },
    ]);
  });

  it('저장할 일정이 없으면 기존 데이터를 지우지 않고 에러를 던진다', async () => {
    fetchYear.mockResolvedValue(scheduleResponse([]));

    await expect(job.run()).rejects.toThrow('학사일정 데이터가 없습니다.');
    expect(replaceAll).not.toHaveBeenCalled();
  });

  it('응답 형식이 이상하면 저장하지 않고 에러를 던진다', async () => {
    fetchYear.mockResolvedValue('<html>점검 중</html>');

    await expect(job.run()).rejects.toThrow();
    expect(replaceAll).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 8: 실패 확인**

Run: `pnpm --dir services/api/batch test -- academic-calendar.job`
Expected: FAIL — 생성자 인자 불일치(현재 잡은 빈 골격).

- [ ] **Step 9: 잡 구현** (`academic-calendar.job.ts`를 교체)

```ts
import { Injectable } from '@nestjs/common';
import { toKstDateString, toKstYear } from '../../utils/date';
import { BatchJob } from '../batch-job.interface';
import { AcademicCalendarClient } from './academic-calendar.client';
import { AcademicCalendarParser } from './academic-calendar.parser';
import { AcademicCalendarRepository } from './academic-calendar.repository';
import type { ParsedAcademicSchedule } from './type/parsed-academic-schedule';

@Injectable()
export class AcademicCalendarJob implements BatchJob {
  readonly name = 'academic-calendar';

  constructor(
    private readonly client: AcademicCalendarClient,
    private readonly parser: AcademicCalendarParser,
    private readonly repository: AcademicCalendarRepository,
  ) {}

  async run(): Promise<void> {
    const now = new Date();
    const year = toKstYear(now);
    const today = toKstDateString(now);

    const parsed: ParsedAcademicSchedule[] = [];
    for (const targetYear of [year, year + 1]) {
      parsed.push(...this.parser.parse(await this.client.fetchYear(targetYear)));
    }

    const schedules = this.dedupe(parsed.filter((schedule) => schedule.endDate >= today));
    if (schedules.length === 0) {
      throw new Error('학사일정 데이터가 없습니다.');
    }

    await this.repository.replaceAll(schedules);
  }

  /**
   * academic_calendar에는 (calendar_type, content, start_date) 유니크 제약이 있어서
   * 종료일만 다른 일정도 하나만 남긴다(먼저 나온 것).
   */
  private dedupe(schedules: ParsedAcademicSchedule[]): ParsedAcademicSchedule[] {
    const seen = new Set<string>();
    return schedules.filter((schedule) => {
      const key = `${schedule.calendarType}|${schedule.content}|${schedule.startDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
```

- [ ] **Step 10: 모듈 등록**

`batch.module.ts`에 import를 추가하고 `TypeOrmModule.forFeature`와 `providers`를 바꾼다.

```ts
import { AcademicCalendar } from './jobs/academic-calendar/domain/academic-calendar.entity';
import { AcademicCalendarClient } from './jobs/academic-calendar/academic-calendar.client';
import { AcademicCalendarParser } from './jobs/academic-calendar/academic-calendar.parser';
import { AcademicCalendarRepository } from './jobs/academic-calendar/academic-calendar.repository';
```
```ts
    TypeOrmModule.forFeature([ShuttleTimetable, ScrapeRun, AcademicCalendar]),
```
providers 목록의 `AcademicCalendarJob` 앞에 `AcademicCalendarClient, AcademicCalendarParser, AcademicCalendarRepository,`를 추가한다.

- [ ] **Step 11: 통과 확인**

Run: `pnpm --dir services/api/batch test`
Expected: 전체 PASS

Run: `pnpm --dir services/api/batch lint:check && pnpm --dir services/api/batch build`
Expected: 오류 없음 (포맷 지적 시 `pnpm --dir services/api/batch lint`)

- [ ] **Step 12: 실제 사이트로 파서 스모크 테스트** (커밋 전, 결과를 PR에 남긴다)

```bash
cd services/api/batch
curl -s -X POST 'https://www.gnu.ac.kr/main/ps/schdul/selectSchdulList.do?mi=1084' \
  --data-urlencode 'schdulLevel=Y' --data-urlencode "srchYear=$(date +%Y)" \
  --data-urlencode 'menuId=1084' --data-urlencode 'sysId=main' > "${TMPDIR:-/tmp}/schedule.json"
pnpm exec ts-node -e "
import { readFileSync } from 'fs';
import { AcademicCalendarParser } from './src/batch/jobs/academic-calendar/academic-calendar.parser';
const items = new AcademicCalendarParser().parse(readFileSync(process.env.TMPDIR + '/schedule.json', 'utf8'));
console.log(items.length, items[0], items[items.length - 1]);
"
```
Expected: 수십~100건 이상, 첫·마지막 항목의 날짜와 내용이 정상이다. (`TMPDIR`가 비어 있으면 `/tmp`로 바꿔 실행한다.) 0건이거나 에러면 커밋하지 말고 원인을 보고한다.

- [ ] **Step 13: 커밋**

```bash
git add services/api/batch/src/batch
git commit -m "$(cat <<'EOF'
✨ feat: 학사일정 수집 잡 구현

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## PR 3 — 학식 잡

### Task 6: 학식 파서

**Files:**
- Create: `services/api/batch/src/batch/jobs/cafeteria/type/parsed-cafeteria-menu.ts`
- Create: `services/api/batch/src/batch/jobs/cafeteria/cafeteria.parser.ts`
- Test: `services/api/batch/src/batch/jobs/cafeteria/cafeteria.parser.spec.ts`

**Interfaces:**
- Produces:
  - `ParsedCafeteriaDish { date: string; day: string; time: string; dishType: string | null; dishCategory: string | null; dishName: string }`
  - `ParsedCafeteriaMenu { startDate: string; endDate: string; dishes: ParsedCafeteriaDish[] }`
  - `CafeteriaLayout { name: string; formType: number | null }`
  - `CafeteriaParser.parse(raw: string, layout: CafeteriaLayout): ParsedCafeteriaMenu`

- [ ] **Step 1: 타입 작성** (`type/parsed-cafeteria-menu.ts`)

```ts
export interface ParsedCafeteriaDish {
  /** YYYY-MM-DD */
  date: string;
  /** 월~일 */
  day: string;
  /** 아침, 점심, 저녁 */
  time: string;
  /** form_type 2 식당의 구분(주식, 국류, 찬류, 후식). 그 외 null */
  dishType: string | null;
  /** 코스/카테고리 이름(예: A코스/한식) */
  dishCategory: string | null;
  dishName: string;
}

export interface ParsedCafeteriaMenu {
  startDate: string;
  endDate: string;
  dishes: ParsedCafeteriaDish[];
}
```

- [ ] **Step 2: 실패하는 테스트 작성** (`cafeteria.parser.spec.ts`)

```ts
import { CafeteriaParser } from './cafeteria.parser';

const HEADER = `
  <thead><tr>
    <th scope="col">구분</th>
    <th scope="col">월 <br>2026-09-21</th>
    <th scope="col">화 <br>2026-09-22</th>
  </tr></thead>`;

const cell = (...divs: Array<{ category?: string; menu: string }>): string =>
  `<td>${divs
    .map(
      ({ category, menu }) =>
        `<div>${category ? `<p class="fm_tit_p mgt15">${category}</p>` : ''}<p class="">${menu}</p></div>`,
    )
    .join('')}</td>`;

const table = (rows: string[]): string =>
  `<table>${HEADER}<tbody>${rows.map((row) => `<tr><th scope="row">행</th>${row}</tr>`).join('')}</tbody></table>`;

describe('CafeteriaParser', () => {
  const parser = new CafeteriaParser();

  it('시간대·카테고리·메뉴를 날짜별로 뽑고 <br>로 메뉴를 나눈다', () => {
    const raw = table([
      cell({ category: 'A코스/한식', menu: '쌀밥<br/>콩나물국<br/>' }, { category: 'B코스/베이커리', menu: '식빵' }) +
        cell({ category: 'A코스/한식', menu: '잡곡밥' }),
      cell({ category: '한그릇', menu: '카레라이스' }) + cell({ category: '한그릇', menu: '쫄면' }),
    ]);

    const menu = parser.parse(raw, { name: '아람관', formType: 1 });

    expect(menu.startDate).toBe('2026-09-21');
    expect(menu.endDate).toBe('2026-09-22');
    expect(menu.dishes).toEqual([
      { date: '2026-09-21', day: '월', time: '아침', dishType: null, dishCategory: 'A코스/한식', dishName: '쌀밥' },
      { date: '2026-09-21', day: '월', time: '아침', dishType: null, dishCategory: 'A코스/한식', dishName: '콩나물국' },
      { date: '2026-09-21', day: '월', time: '아침', dishType: null, dishCategory: 'B코스/베이커리', dishName: '식빵' },
      { date: '2026-09-22', day: '화', time: '아침', dishType: null, dishCategory: 'A코스/한식', dishName: '잡곡밥' },
      { date: '2026-09-21', day: '월', time: '점심', dishType: null, dishCategory: '한그릇', dishName: '카레라이스' },
      { date: '2026-09-22', day: '화', time: '점심', dishType: null, dishCategory: '한그릇', dishName: '쫄면' },
    ]);
  });

  it('form_type 2는 행을 주식·국류 같은 구분으로 보고 시간대는 점심으로 고정한다', () => {
    const raw = table([cell({ menu: '쌀밥' }) + cell({ menu: '현미밥' }), cell({ menu: '된장국' }) + cell({ menu: '미역국' })]);

    const menu = parser.parse(raw, { name: '가좌식당', formType: 2 });

    expect(menu.dishes.map((dish) => [dish.date, dish.time, dish.dishType, dish.dishName])).toEqual([
      ['2026-09-21', '점심', '주식', '쌀밥'],
      ['2026-09-22', '점심', '주식', '현미밥'],
      ['2026-09-21', '점심', '국류', '된장국'],
      ['2026-09-22', '점심', '국류', '미역국'],
    ]);
  });

  it('교육문화식당은 시간대를 점심으로 고정한다', () => {
    const raw = table([cell({ menu: '비빔밥' }) + cell({ menu: '' })]);

    const menu = parser.parse(raw, { name: '교육문화식당', formType: 1 });

    expect(menu.dishes).toEqual([
      { date: '2026-09-21', day: '월', time: '점심', dishType: null, dishCategory: null, dishName: '비빔밥' },
    ]);
  });

  it('메뉴가 모두 비어 있으면 날짜 범위만 있고 dishes는 빈 배열이다', () => {
    const raw = table([cell({ menu: '' }) + cell({ menu: '<br/><br/>' })]);

    const menu = parser.parse(raw, { name: '아람관', formType: 1 });

    expect(menu).toEqual({ startDate: '2026-09-21', endDate: '2026-09-22', dishes: [] });
  });

  it('식단 표를 찾을 수 없으면 에러를 던진다', () => {
    expect(() => parser.parse('<html><body>점검 중</body></html>', { name: '아람관', formType: 1 })).toThrow(
      '식단 표를 찾을 수 없습니다.',
    );
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm --dir services/api/batch test -- cafeteria.parser`
Expected: FAIL — 모듈 없음.

- [ ] **Step 4: 구현** (`cafeteria.parser.ts`)

```ts
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { ParsedCafeteriaDish, ParsedCafeteriaMenu } from './type/parsed-cafeteria-menu';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const MEAL_TIMES = ['아침', '점심', '저녁'];
const DISH_TYPES = ['주식', '국류', '찬류', '후식'];
const DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;
const LUNCH_ONLY_CAFETERIA = '교육문화식당';
const TYPED_FORM = 2;

export interface CafeteriaLayout {
  name: string;
  formType: number | null;
}

interface Slot {
  date: string;
  day: string;
  time: string;
  dishType: string | null;
}

@Injectable()
export class CafeteriaParser {
  parse(raw: string, layout: CafeteriaLayout): ParsedCafeteriaMenu {
    const $ = cheerio.load(raw);

    // 첫 번째 th는 "구분" 열이다. 날짜를 못 읽은 열은 undefined로 남겨 열 위치를 유지한다.
    const dates = $('thead th')
      .toArray()
      .slice(1)
      .map((th) => DATE_PATTERN.exec($(th).text())?.[0]);
    const rows = $('tbody > tr').toArray();
    const knownDates = dates.filter((date): date is string => date !== undefined).sort();

    if (knownDates.length === 0 || rows.length === 0) {
      throw new Error('식단 표를 찾을 수 없습니다.');
    }

    const isTyped = layout.formType === TYPED_FORM;
    const isLunchOnly = isTyped || layout.name === LUNCH_ONLY_CAFETERIA;
    const slotCount = Math.min(rows.length, isTyped ? DISH_TYPES.length : MEAL_TIMES.length);
    const dishes: ParsedCafeteriaDish[] = [];

    for (let index = 0; index < slotCount; index += 1) {
      const dishType = isTyped ? DISH_TYPES[index] : null;
      const time = isLunchOnly ? '점심' : MEAL_TIMES[index];
      const cells = $(rows[index]).children('td').toArray();

      DAYS.forEach((day, dayIndex) => {
        const cellNode = cells[dayIndex];
        const date = dates[dayIndex];
        if (!cellNode || !date) return;
        dishes.push(...this.parseCell($, cellNode, { date, day, time, dishType }));
      });
    }

    return {
      startDate: knownDates[0],
      endDate: knownDates[knownDates.length - 1],
      dishes,
    };
  }

  private parseCell($: cheerio.CheerioAPI, cell: AnyNode, slot: Slot): ParsedCafeteriaDish[] {
    const dishes: ParsedCafeteriaDish[] = [];
    // 카테고리 제목이 없는 칸은 앞에서 읽은 카테고리를 이어 쓴다.
    let dishCategory: string | null = null;

    $(cell)
      .find('div')
      .each((_, div) => {
        const header = $(div).find('p.mgt15').first();
        if (header.length > 0) dishCategory = header.text().trim();

        const menu = $(div)
          .find('p')
          .filter((__, p) => !$(p).attr('class'))
          .first();

        for (const dishName of this.splitMenu($, menu)) {
          dishes.push({ ...slot, dishCategory, dishName });
        }
      });

    return dishes;
  }

  /** <br>을 기준으로 메뉴 이름을 나누고 빈 항목은 버린다. */
  private splitMenu($: cheerio.CheerioAPI, menu: cheerio.Cheerio<AnyNode>): string[] {
    const items: string[] = [];
    let buffer = '';
    const flush = () => {
      const name = buffer.trim();
      if (name) items.push(name);
      buffer = '';
    };

    menu.contents().each((_, node) => {
      if ('name' in node && node.name === 'br') flush();
      else buffer += $(node).text();
    });
    flush();

    return items;
  }
}
```

- [ ] **Step 5: 통과 확인**

Run: `pnpm --dir services/api/batch test -- cafeteria.parser`
Expected: PASS (5건)

- [ ] **Step 6: 실제 사이트로 스모크 테스트** (결과를 PR에 남긴다)

```bash
cd services/api/batch
curl -s 'https://www.gnu.ac.kr/dorm/ad/fm/foodmenu/selectFoodMenuView.do?restSeq=47&mi=7278' > "${TMPDIR:-/tmp}/food.html"
pnpm exec ts-node -e "
import { readFileSync } from 'fs';
import { CafeteriaParser } from './src/batch/jobs/cafeteria/cafeteria.parser';
const menu = new CafeteriaParser().parse(readFileSync(process.env.TMPDIR + '/food.html', 'utf8'), { name: '아람관', formType: 1 });
console.log(menu.startDate, menu.endDate, menu.dishes.length, menu.dishes[0]);
"
```
Expected: 날짜 범위가 7일(월~일)이고 dishes가 수십 건 이상이며, 첫 항목이 `{ time: '아침', dishCategory: 'A코스/한식', dishName: '쌀밥 누룽지' … }` 꼴이다.

- [ ] **Step 7: 커밋**

```bash
git add services/api/batch
git commit -m "$(cat <<'EOF'
✨ feat: 학식 식단 파서 구현

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: 학식 클라이언트·저장소·잡

**Files:**
- Create: `services/api/batch/src/batch/jobs/cafeteria/domain/cafeteria.entity.ts`
- Create: `services/api/batch/src/batch/jobs/cafeteria/domain/cafeteria-diet.entity.ts`
- Create: `services/api/batch/src/batch/jobs/cafeteria/cafeteria.client.ts` (+ `.spec.ts`)
- Create: `services/api/batch/src/batch/jobs/cafeteria/cafeteria.repository.ts` (+ `.spec.ts`)
- Modify: `services/api/batch/src/batch/jobs/cafeteria/cafeteria.job.ts` (+ 신규 `.spec.ts`)
- Modify: `services/api/batch/src/batch/batch.module.ts`

**Interfaces:**
- Consumes: `CafeteriaParser.parse(raw, layout)`, `ParsedCafeteriaDish`(Task 6), `BatchJob`(Task 2)
- Produces:
  - `Cafeteria` 엔티티(`id, campusId, name, mi, restSeq, type, schSysId, formType, lastDate, thumbnailUrl`)
  - `CafeteriaClient.fetch(cafeteria: Pick<Cafeteria, 'type' | 'restSeq' | 'mi' | 'schSysId'>): Promise<string>`
  - `CafeteriaRepository.findAll()`, `findById(id: number)`, `replaceWeek(cafeteriaId: number, range: { startDate: string; endDate: string }, dishes: ParsedCafeteriaDish[]): Promise<void>`

- [ ] **Step 1: 엔티티 작성**

`domain/cafeteria.entity.ts`:

```ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cafeteria')
export class Cafeteria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'campus_id' })
  campusId: number;

  @Column({ name: 'cafeteria_name_ko' })
  name: string;

  @Column()
  mi: number;

  @Column({ name: 'rest_seq' })
  restSeq: number;

  @Column()
  type: string;

  @Column({ name: 'sch_sys_id', type: 'varchar', nullable: true })
  schSysId: string | null;

  @Column({ name: 'form_type', type: 'smallint', nullable: true })
  formType: number | null;

  @Column({ name: 'last_date', type: 'date', nullable: true })
  lastDate: string | null;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;
}
```

`domain/cafeteria-diet.entity.ts`:

```ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cafeteria_diet')
export class CafeteriaDiet {
  @PrimaryGeneratedColumn({ name: 'diet_id' })
  id: number;

  @Column({ name: 'cafeteria_id', type: 'bigint' })
  cafeteriaId: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  day: string;

  @Column()
  time: string;

  @Column({ name: 'dish_category', type: 'varchar', nullable: true })
  dishCategory: string | null;

  @Column({ name: 'dish_type', type: 'varchar', nullable: true })
  dishType: string | null;

  @Column({ name: 'dish_name' })
  dishName: string;
}
```

- [ ] **Step 2: 클라이언트 — 테스트와 구현**

`cafeteria.client.spec.ts`:

```ts
import { FetchHttpClient } from '../../http/fetch-http.client';
import { CafeteriaClient } from './cafeteria.client';

describe('CafeteriaClient', () => {
  const getText = jest.fn().mockResolvedValue('<html></html>');
  const client = new CafeteriaClient({ getText } as unknown as FetchHttpClient);

  beforeEach(() => getText.mockClear());

  it('식당 정보로 식단 URL을 만들어 요청한다', async () => {
    await client.fetch({ type: 'dorm', restSeq: 47, mi: 7278, schSysId: null });

    expect(getText).toHaveBeenCalledWith(
      'https://www.gnu.ac.kr/dorm/ad/fm/foodmenu/selectFoodMenuView.do?restSeq=47&mi=7278',
    );
  });

  it('schSysId가 있으면 쿼리에 붙인다', async () => {
    await client.fetch({ type: 'main', restSeq: 3, mi: 100, schSysId: 'hs' });

    expect(getText).toHaveBeenCalledWith(
      'https://www.gnu.ac.kr/main/ad/fm/foodmenu/selectFoodMenuView.do?restSeq=3&mi=100&schSysId=hs',
    );
  });

  it('schSysId가 빈 문자열이면 붙이지 않는다', async () => {
    await client.fetch({ type: 'dorm', restSeq: 47, mi: 7278, schSysId: '' });

    expect(getText.mock.calls[0][0]).not.toContain('schSysId');
  });
});
```

`cafeteria.client.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { FetchHttpClient } from '../../http/fetch-http.client';
import type { Cafeteria } from './domain/cafeteria.entity';

@Injectable()
export class CafeteriaClient {
  constructor(private readonly httpClient: FetchHttpClient) {}

  async fetch(
    cafeteria: Pick<Cafeteria, 'type' | 'restSeq' | 'mi' | 'schSysId'>,
  ): Promise<string> {
    const { type, restSeq, mi, schSysId } = cafeteria;
    let url = `https://www.gnu.ac.kr/${type}/ad/fm/foodmenu/selectFoodMenuView.do?restSeq=${restSeq}&mi=${mi}`;
    if (schSysId) url += `&schSysId=${schSysId}`;

    return this.httpClient.getText(url);
  }
}
```

- [ ] **Step 3: 저장소 — 테스트와 구현**

`cafeteria.repository.spec.ts`:

```ts
import { DataSource, Repository } from 'typeorm';
import { CafeteriaRepository } from './cafeteria.repository';
import { Cafeteria } from './domain/cafeteria.entity';
import { CafeteriaDiet } from './domain/cafeteria-diet.entity';

const dish = (date: string, dishName: string) => ({
  date,
  day: '월',
  time: '점심',
  dishType: null,
  dishCategory: 'A코스',
  dishName,
});

describe('CafeteriaRepository', () => {
  it('한 트랜잭션에서 해당 주를 지우고 새 식단을 넣고 last_date를 갱신한다', async () => {
    const calls: string[] = [];
    const manager = {
      delete: jest.fn(async () => void calls.push('delete')),
      insert: jest.fn(async () => void calls.push('insert')),
      update: jest.fn(async () => void calls.push('update')),
    };
    const dataSource = {
      transaction: jest.fn(async (work: (m: typeof manager) => Promise<void>) => work(manager)),
    };
    const repository = new CafeteriaRepository(
      {} as Repository<Cafeteria>,
      dataSource as unknown as DataSource,
    );

    await repository.replaceWeek(
      7,
      { startDate: '2026-09-21', endDate: '2026-09-27' },
      [dish('2026-09-21', '쌀밥'), dish('2026-09-23', '국')],
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['delete', 'insert', 'update']);
    expect(manager.insert).toHaveBeenCalledWith(CafeteriaDiet, [
      { cafeteriaId: 7, date: '2026-09-21', day: '월', time: '점심', dishCategory: 'A코스', dishType: null, dishName: '쌀밥' },
      { cafeteriaId: 7, date: '2026-09-23', day: '월', time: '점심', dishCategory: 'A코스', dishType: null, dishName: '국' },
    ]);
    expect(manager.update).toHaveBeenCalledWith(Cafeteria, { id: 7 }, { lastDate: '2026-09-23' });
  });

  it('식단이 많으면 나눠서 삽입한다', async () => {
    const manager = { delete: jest.fn(), insert: jest.fn(), update: jest.fn() };
    const dataSource = {
      transaction: jest.fn(async (work: (m: typeof manager) => Promise<void>) => work(manager)),
    };
    const repository = new CafeteriaRepository(
      {} as Repository<Cafeteria>,
      dataSource as unknown as DataSource,
    );
    const dishes = Array.from({ length: 1200 }, (_, i) => dish('2026-09-21', `메뉴${i}`));

    await repository.replaceWeek(1, { startDate: '2026-09-21', endDate: '2026-09-27' }, dishes);

    expect(manager.insert).toHaveBeenCalledTimes(3);
  });
});
```

`cafeteria.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { Cafeteria } from './domain/cafeteria.entity';
import { CafeteriaDiet } from './domain/cafeteria-diet.entity';
import type { ParsedCafeteriaDish } from './type/parsed-cafeteria-menu';

const INSERT_CHUNK_SIZE = 500;

@Injectable()
export class CafeteriaRepository {
  constructor(
    @InjectRepository(Cafeteria)
    private readonly repository: Repository<Cafeteria>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Cafeteria[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<Cafeteria | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * 식당의 해당 기간 식단을 새 식단으로 교체하고 마지막 식단 날짜를 갱신한다.
   * 중간에 실패하면 삭제도 롤백된다.
   */
  async replaceWeek(
    cafeteriaId: number,
    range: { startDate: string; endDate: string },
    dishes: ParsedCafeteriaDish[],
  ): Promise<void> {
    const rows = dishes.map((dish) => ({
      cafeteriaId,
      date: dish.date,
      day: dish.day,
      time: dish.time,
      dishCategory: dish.dishCategory,
      dishType: dish.dishType,
      dishName: dish.dishName,
    }));
    const lastDate = dishes.reduce(
      (latest, dish) => (dish.date > latest ? dish.date : latest),
      dishes[0].date,
    );

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(CafeteriaDiet, {
        cafeteriaId,
        date: Between(range.startDate, range.endDate),
      });
      for (let start = 0; start < rows.length; start += INSERT_CHUNK_SIZE) {
        await manager.insert(CafeteriaDiet, rows.slice(start, start + INSERT_CHUNK_SIZE));
      }
      await manager.update(Cafeteria, { id: cafeteriaId }, { lastDate });
    });
  }
}
```

- [ ] **Step 4: 잡 — 실패하는 테스트 작성** (`cafeteria.job.spec.ts`)

```ts
import { CafeteriaClient } from './cafeteria.client';
import { CafeteriaJob } from './cafeteria.job';
import { CafeteriaParser } from './cafeteria.parser';
import { CafeteriaRepository } from './cafeteria.repository';
import type { Cafeteria } from './domain/cafeteria.entity';

const html = (menu: string) => `
  <table>
    <thead><tr><th>구분</th><th>월 <br>2026-09-21</th></tr></thead>
    <tbody><tr><th>아침</th><td><div><p class="fm_tit_p mgt15">A코스</p><p class="">${menu}</p></div></td></tr></tbody>
  </table>`;

const cafeteria = {
  id: 7,
  name: '아람관',
  type: 'dorm',
  restSeq: 47,
  mi: 7278,
  schSysId: '',
  formType: 1,
} as Cafeteria;

describe('CafeteriaJob', () => {
  let client: { fetch: jest.Mock };
  let repository: { findAll: jest.Mock; findById: jest.Mock; replaceWeek: jest.Mock };
  let job: CafeteriaJob;

  beforeEach(() => {
    client = { fetch: jest.fn().mockResolvedValue(html('쌀밥<br/>국')) };
    repository = {
      findAll: jest.fn().mockResolvedValue([cafeteria, { ...cafeteria, id: 8 }]),
      findById: jest.fn().mockResolvedValue(cafeteria),
      replaceWeek: jest.fn().mockResolvedValue(undefined),
    };
    job = new CafeteriaJob(
      client as unknown as CafeteriaClient,
      new CafeteriaParser(),
      repository as unknown as CafeteriaRepository,
    );
  });

  it('식당 id를 문자열 대상 목록으로 돌려준다', async () => {
    await expect(job.targets()).resolves.toEqual(['7', '8']);
  });

  it('대상 식당의 식단을 수집해 그 주를 교체한다', async () => {
    await job.run('7');

    expect(repository.findById).toHaveBeenCalledWith(7);
    expect(client.fetch).toHaveBeenCalledWith(cafeteria);
    expect(repository.replaceWeek).toHaveBeenCalledWith(
      7,
      { startDate: '2026-09-21', endDate: '2026-09-21' },
      [
        { date: '2026-09-21', day: '월', time: '아침', dishType: null, dishCategory: 'A코스', dishName: '쌀밥' },
        { date: '2026-09-21', day: '월', time: '아침', dishType: null, dishCategory: 'A코스', dishName: '국' },
      ],
    );
  });

  it('target 없이 실행하면 에러를 던진다', async () => {
    await expect(job.run()).rejects.toThrow('target');
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('없는 식당이면 에러를 던진다', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(job.run('99')).rejects.toThrow('99');
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('숫자가 아닌 target이면 조회하지 않고 에러를 던진다', async () => {
    await expect(job.run('abc')).rejects.toThrow('abc');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('메뉴가 하나도 없으면 기존 식단을 바꾸지 않고 성공한다', async () => {
    client.fetch.mockResolvedValue(html(''));

    await expect(job.run('7')).resolves.toBeUndefined();
    expect(repository.replaceWeek).not.toHaveBeenCalled();
  });

  it('식단 표가 없는 페이지면 에러를 던지고 저장하지 않는다', async () => {
    client.fetch.mockResolvedValue('<html></html>');

    await expect(job.run('7')).rejects.toThrow('식단 표를 찾을 수 없습니다.');
    expect(repository.replaceWeek).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: 실패 확인**

Run: `pnpm --dir services/api/batch test -- cafeteria.job`
Expected: FAIL — 잡이 빈 골격이라 `targets`가 없고 생성자 인자가 맞지 않는다.

- [ ] **Step 6: 잡 구현** (`cafeteria.job.ts`를 교체)

```ts
import { Injectable } from '@nestjs/common';
import { BatchJob } from '../batch-job.interface';
import { CafeteriaClient } from './cafeteria.client';
import { CafeteriaParser } from './cafeteria.parser';
import { CafeteriaRepository } from './cafeteria.repository';

@Injectable()
export class CafeteriaJob implements BatchJob {
  readonly name = 'cafeteria';

  constructor(
    private readonly client: CafeteriaClient,
    private readonly parser: CafeteriaParser,
    private readonly repository: CafeteriaRepository,
  ) {}

  /** 식당마다 scrape_run을 남기기 위해 식당 id를 대상으로 돌려준다. */
  async targets(): Promise<string[]> {
    const cafeterias = await this.repository.findAll();
    return cafeterias.map((cafeteria) => String(cafeteria.id));
  }

  async run(target?: string): Promise<void> {
    if (target === undefined) {
      throw new Error('cafeteria 수집에는 target(식당 id)이 필요합니다.');
    }

    const cafeteriaId = Number(target);
    if (!Number.isInteger(cafeteriaId)) {
      throw new Error(`올바르지 않은 식당 id입니다: ${target}`);
    }

    const cafeteria = await this.repository.findById(cafeteriaId);
    if (!cafeteria) {
      throw new Error(`식당을 찾을 수 없습니다: ${target}`);
    }

    const raw = await this.client.fetch(cafeteria);
    const menu = this.parser.parse(raw, {
      name: cafeteria.name,
      formType: cafeteria.formType,
    });

    // 휴무 주간처럼 메뉴가 없으면 기존 식단을 그대로 둔다.
    if (menu.dishes.length === 0) return;

    await this.repository.replaceWeek(
      cafeteria.id,
      { startDate: menu.startDate, endDate: menu.endDate },
      menu.dishes,
    );
  }
}
```

- [ ] **Step 7: 모듈 등록**

`batch.module.ts`에 추가:

```ts
import { Cafeteria } from './jobs/cafeteria/domain/cafeteria.entity';
import { CafeteriaDiet } from './jobs/cafeteria/domain/cafeteria-diet.entity';
import { CafeteriaClient } from './jobs/cafeteria/cafeteria.client';
import { CafeteriaParser } from './jobs/cafeteria/cafeteria.parser';
import { CafeteriaRepository } from './jobs/cafeteria/cafeteria.repository';
```
`forFeature`에 `Cafeteria, CafeteriaDiet`를 추가하고, providers의 `CafeteriaJob` 앞에 `CafeteriaClient, CafeteriaParser, CafeteriaRepository,`를 추가한다.

- [ ] **Step 8: 통과 확인**

Run: `pnpm --dir services/api/batch test`
Expected: 전체 PASS

Run: `pnpm --dir services/api/batch lint:check && pnpm --dir services/api/batch build`
Expected: 오류 없음

- [ ] **Step 9: 커밋**

```bash
git add services/api/batch
git commit -m "$(cat <<'EOF'
✨ feat: 학식 수집 잡 구현 (식당별 scrape_run)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## PR 4 — 학교 공지 잡

### Task 8: 공지 파서와 클라이언트

**Files:**
- Create: `services/api/batch/src/batch/jobs/notice/domain/notice-category.entity.ts`
- Create: `services/api/batch/src/batch/jobs/notice/domain/notice.entity.ts`
- Create: `services/api/batch/src/batch/jobs/notice/type/parsed-notice.ts`
- Create: `services/api/batch/src/batch/jobs/notice/notice.parser.ts` (+ `.spec.ts`)
- Create: `services/api/batch/src/batch/jobs/notice/notice.client.ts` (+ `.spec.ts`)

**Interfaces:**
- Produces:
  - `ParsedNotice { nttSn: number; title: string; createdAt: string }`(`createdAt`은 `YYYY-MM-DD`)
  - `NoticeParser.parse(raw: string): ParsedNotice[]`
  - `NoticeClient.fetch(category: Pick<NoticeCategory, 'mi' | 'bbsId'>, site?: string): Promise<string>` (`site` 기본값 `'main'`, 나중에 학과 공지가 학과 영문 이름을 넘긴다)
  - `NoticeCategory`, `Notice` 엔티티

- [ ] **Step 1: 엔티티와 타입 작성**

`type/parsed-notice.ts`:

```ts
export interface ParsedNotice {
  /** 게시글 번호(게시판 안에서 증가) */
  nttSn: number;
  title: string;
  /** 등록일, YYYY-MM-DD */
  createdAt: string;
}
```

`domain/notice-category.entity.ts`:

```ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notice_category')
export class NoticeCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'department_id' })
  departmentId: number;

  @Column({ length: 50 })
  category: string;

  @Column()
  mi: number;

  @Column({ name: 'bbs_id' })
  bbsId: number;

  @Column({ name: 'last_ntt_sn', default: 0 })
  lastNttSn: number;

  @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
```

`domain/notice.entity.ts`:

```ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notice')
export class Notice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'ntt_sn' })
  nttSn: number;

  @Column({ name: 'created_at', type: 'date' })
  createdAt: string;
}
```

- [ ] **Step 2: 파서 — 실패하는 테스트 작성** (`notice.parser.spec.ts`)

```ts
import { NoticeParser } from './notice.parser';

const HEADERS = `
  <thead><tr>
    <th scope="col" class="BD_tm_none">번호</th>
    <th scope="col" class="BD_tm_none">구분</th>
    <th scope="col">제목</th>
    <th scope="col" class="BD_tm_none">부서명</th>
    <th scope="col widS15">등록일</th>
  </tr></thead>`;

const row = (id: string, title: string, date: string, pinned = false): string => `
  <tr>
    <td class="BD_tm_none">${pinned ? '<b class="btn_S btn_default">공지</b>' : id}</td>
    <td class="BD_tm_none">경상국립대</td>
    <td class="ta_l">
      <a href="javascript:" data-id="${id}" class="nttInfoBtn">
        ${title}
      </a>
    </td>
    <td class="BD_tm_none">학사지원과</td>
    <td>${date}</td>
  </tr>`;

const table = (...rows: string[]): string =>
  `<table>${HEADERS}<tbody>${rows.join('')}</tbody></table>`;

describe('NoticeParser', () => {
  const parser = new NoticeParser();

  it('게시글 번호·제목·등록일을 뽑는다', () => {
    const raw = table(
      row('8610403', '2026학년도 2학기 수강신청확인원 제출 안내', '2026.09.21', true),
      row('8610100', '장학금 신청 안내', '2026.09.18'),
    );

    expect(parser.parse(raw)).toEqual([
      { nttSn: 8610403, title: '2026학년도 2학기 수강신청확인원 제출 안내', createdAt: '2026-09-21' },
      { nttSn: 8610100, title: '장학금 신청 안내', createdAt: '2026-09-18' },
    ]);
  });

  it('제목 안의 여러 공백과 줄바꿈을 정리하고 아이콘 태그의 글자는 섞지 않는다', () => {
    const raw = table(
      row('1', '제목  앞뒤\n   공백 <span class="new">N</span>', '2026.09.01'),
    );

    expect(parser.parse(raw)[0].title).toBe('제목 앞뒤 공백');
  });

  it('번호나 날짜를 읽을 수 없는 행은 건너뛴다', () => {
    const raw = table(row('abc', '깨진 번호', '2026.09.01'), row('5', '깨진 날짜', '어제'), row('6', '정상', '2026.09.02'));

    expect(parser.parse(raw)).toEqual([{ nttSn: 6, title: '정상', createdAt: '2026-09-02' }]);
  });

  it('게시글이 없는 게시판은 빈 배열이다', () => {
    const raw = `<table>${HEADERS}<tbody><tr><td colspan="5">등록된 게시물이 없습니다.</td></tr></tbody></table>`;

    expect(parser.parse(raw)).toEqual([]);
  });

  it('게시글 링크는 있는데 하나도 해석하지 못하면 구조가 바뀐 것으로 보고 에러를 던진다', () => {
    const raw = table(row('abc', '깨진 번호', '2026.09.01'));

    expect(() => parser.parse(raw)).toThrow('공지 목록 행을 해석할 수 없습니다.');
  });

  it('등록일 열이 있는 게시판 표가 아니면 에러를 던진다', () => {
    expect(() => parser.parse('<html><body>점검 중</body></html>')).toThrow(
      '공지 목록 표를 찾을 수 없습니다.',
    );
    expect(() =>
      parser.parse('<table><thead><tr><th>일</th><th>월</th></tr></thead><tbody></tbody></table>'),
    ).toThrow('공지 목록 표를 찾을 수 없습니다.');
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `pnpm --dir services/api/batch test -- notice.parser`
Expected: FAIL — 모듈 없음.

- [ ] **Step 4: 파서 구현** (`notice.parser.ts`)

```ts
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { ParsedNotice } from './type/parsed-notice';

const DATE_HEADER = '등록일';
const DATE_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2})$/;

@Injectable()
export class NoticeParser {
  parse(raw: string): ParsedNotice[] {
    const $ = cheerio.load(raw);

    const headers = $('thead th')
      .toArray()
      .map((th) => $(th).text().trim());
    const dateIndex = headers.indexOf(DATE_HEADER);
    if (dateIndex === -1 || $('tbody').length === 0) {
      throw new Error('공지 목록 표를 찾을 수 없습니다.');
    }

    const notices = $('tbody > tr')
      .toArray()
      .map((row) => this.parseRow($, row, dateIndex))
      .filter((notice): notice is ParsedNotice => notice !== null);

    // 게시글이 없는 게시판은 정상이다. 링크는 있는데 하나도 못 읽었다면 구조가 바뀐 것이다.
    if (notices.length === 0 && $('a.nttInfoBtn').length > 0) {
      throw new Error('공지 목록 행을 해석할 수 없습니다.');
    }

    return notices;
  }

  private parseRow(
    $: cheerio.CheerioAPI,
    row: AnyNode,
    dateIndex: number,
  ): ParsedNotice | null {
    const anchor = $(row).find('a.nttInfoBtn').first();
    const nttSn = Number(anchor.attr('data-id'));
    const date = DATE_PATTERN.exec($(row).children('td').eq(dateIndex).text().trim());
    const title = this.readTitle($, anchor);

    if (!Number.isInteger(nttSn) || nttSn <= 0 || !date || !title) return null;

    return { nttSn, title, createdAt: `${date[1]}-${date[2]}-${date[3]}` };
  }

  /** 링크 안의 텍스트 노드만 읽는다. "N" 같은 아이콘 태그의 글자는 제목이 아니다. */
  private readTitle($: cheerio.CheerioAPI, anchor: cheerio.Cheerio<AnyNode>): string {
    return anchor
      .contents()
      .toArray()
      .filter((node) => node.type === 'text')
      .map((node) => $(node).text())
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

- [ ] **Step 5: 클라이언트 — 테스트와 구현**

`notice.client.spec.ts`:

```ts
import { FetchHttpClient } from '../../http/fetch-http.client';
import { NoticeClient } from './notice.client';

describe('NoticeClient', () => {
  const getText = jest.fn().mockResolvedValue('<html></html>');
  const client = new NoticeClient({ getText } as unknown as FetchHttpClient);

  beforeEach(() => getText.mockClear());

  it('학교 공지 게시판 URL을 만들어 요청한다', async () => {
    await client.fetch({ mi: 1127, bbsId: 1029 });

    expect(getText).toHaveBeenCalledWith(
      'https://www.gnu.ac.kr/main/na/ntt/selectNttList.do?mi=1127&bbsId=1029',
    );
  });

  it('학과 사이트를 지정하면 그 사이트의 게시판을 요청한다', async () => {
    await client.fetch({ mi: 2, bbsId: 3 }, 'inmun');

    expect(getText).toHaveBeenCalledWith(
      'https://www.gnu.ac.kr/inmun/na/ntt/selectNttList.do?mi=2&bbsId=3',
    );
  });
});
```

`notice.client.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { FetchHttpClient } from '../../http/fetch-http.client';
import type { NoticeCategory } from './domain/notice-category.entity';

const UNIVERSITY_SITE = 'main';

@Injectable()
export class NoticeClient {
  constructor(private readonly httpClient: FetchHttpClient) {}

  /** 게시판 첫 페이지를 가져온다. site는 학교 공지면 main, 학과 공지면 학과 영문 이름이다. */
  async fetch(
    category: Pick<NoticeCategory, 'mi' | 'bbsId'>,
    site: string = UNIVERSITY_SITE,
  ): Promise<string> {
    return this.httpClient.getText(
      `https://www.gnu.ac.kr/${site}/na/ntt/selectNttList.do?mi=${category.mi}&bbsId=${category.bbsId}`,
    );
  }
}
```

- [ ] **Step 6: 통과 확인**

Run: `pnpm --dir services/api/batch test -- notice.parser notice.client`
Expected: PASS

- [ ] **Step 7: 실제 사이트로 스모크 테스트** (결과를 PR에 남긴다)

```bash
cd services/api/batch
curl -s 'https://www.gnu.ac.kr/main/na/ntt/selectNttList.do?mi=1127&bbsId=1029' > "${TMPDIR:-/tmp}/notice.html"
pnpm exec ts-node -e "
import { readFileSync } from 'fs';
import { NoticeParser } from './src/batch/jobs/notice/notice.parser';
const notices = new NoticeParser().parse(readFileSync(process.env.TMPDIR + '/notice.html', 'utf8'));
console.log(notices.length, notices[0], notices[notices.length - 1]);
"
```
Expected: 20건 안팎, 첫 항목이 `{ nttSn: <숫자>, title: '…', createdAt: 'YYYY-MM-DD' }` 꼴이다.

- [ ] **Step 8: 커밋**

```bash
git add services/api/batch
git commit -m "$(cat <<'EOF'
✨ feat: 공지 게시판 파서와 클라이언트 구현

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: 학교 공지 저장소와 잡

**Files:**
- Create: `services/api/batch/src/batch/jobs/notice/notice.repository.ts`
- Create: `services/api/batch/src/batch/jobs/notice/university-notice.job.ts` (+ `.spec.ts`)
- Delete: `services/api/batch/src/batch/jobs/notice/notice.job.ts`
- Modify: `services/api/batch/src/batch/batch.module.ts`

**Interfaces:**
- Consumes: `NoticeClient`, `NoticeParser`, `ParsedNotice`, `NoticeCategory`(Task 8), `BatchJob`(Task 2)
- Produces:
  - `NoticeRepository.findCategoriesByDepartmentId(departmentId: number): Promise<NoticeCategory[]>`, `findCategoryById(id: number)`, `saveNew(categoryId: number, notices: ParsedNotice[]): Promise<void>`
  - 잡 이름 `university-notice`, `targets()`는 카테고리 id 문자열 목록

- [ ] **Step 1: 잡 — 실패하는 테스트 작성** (`university-notice.job.spec.ts`)

```ts
import { NoticeClient } from './notice.client';
import { NoticeParser } from './notice.parser';
import { NoticeRepository } from './notice.repository';
import { UniversityNoticeJob } from './university-notice.job';
import type { NoticeCategory } from './domain/notice-category.entity';

const html = (...items: Array<[id: number, date: string]>) => `
  <table>
    <thead><tr><th>번호</th><th>제목</th><th>등록일</th></tr></thead>
    <tbody>${items
      .map(
        ([id, date]) =>
          `<tr><td>${id}</td><td><a data-id="${id}" class="nttInfoBtn">공지 ${id}</a></td><td>${date}</td></tr>`,
      )
      .join('')}</tbody>
  </table>`;

const category = (overrides: Partial<NoticeCategory> = {}): NoticeCategory =>
  ({ id: 3, departmentId: 117, category: '학사', mi: 1127, bbsId: 1029, lastNttSn: 0, ...overrides }) as NoticeCategory;

describe('UniversityNoticeJob', () => {
  let client: { fetch: jest.Mock };
  let repository: {
    findCategoriesByDepartmentId: jest.Mock;
    findCategoryById: jest.Mock;
    saveNew: jest.Mock;
  };
  let job: UniversityNoticeJob;

  beforeEach(() => {
    client = { fetch: jest.fn() };
    repository = {
      findCategoriesByDepartmentId: jest.fn().mockResolvedValue([category(), category({ id: 4 })]),
      findCategoryById: jest.fn().mockResolvedValue(category()),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };
    job = new UniversityNoticeJob(
      client as unknown as NoticeClient,
      new NoticeParser(),
      repository as unknown as NoticeRepository,
    );
  });

  it('학교 공지(학과 117)의 카테고리 id를 대상으로 돌려준다', async () => {
    await expect(job.targets()).resolves.toEqual(['3', '4']);
    expect(repository.findCategoriesByDepartmentId).toHaveBeenCalledWith(117);
  });

  it('첫 실행(last_ntt_sn = 0)은 첫 페이지의 글을 모두 오래된 순으로 저장한다', async () => {
    client.fetch.mockResolvedValue(html([30, '2026.09.21'], [20, '2026.09.10'], [10, '2026.08.01']));

    await job.run('3');

    expect(client.fetch).toHaveBeenCalledWith(category());
    expect(repository.saveNew).toHaveBeenCalledWith(3, [
      { nttSn: 10, title: '공지 10', createdAt: '2026-08-01' },
      { nttSn: 20, title: '공지 20', createdAt: '2026-09-10' },
      { nttSn: 30, title: '공지 30', createdAt: '2026-09-21' },
    ]);
  });

  it('30일이 지난 글도 새 글이면 저장한다', async () => {
    repository.findCategoryById.mockResolvedValue(category({ lastNttSn: 5 }));
    client.fetch.mockResolvedValue(html([6, '2025.01.01']));

    await job.run('3');

    expect(repository.saveNew).toHaveBeenCalledWith(3, [
      { nttSn: 6, title: '공지 6', createdAt: '2025-01-01' },
    ]);
  });

  it('last_ntt_sn 이하의 글은 저장하지 않는다', async () => {
    repository.findCategoryById.mockResolvedValue(category({ lastNttSn: 20 }));
    client.fetch.mockResolvedValue(html([30, '2026.09.21'], [20, '2026.09.10'], [10, '2026.08.01']));

    await job.run('3');

    expect(repository.saveNew).toHaveBeenCalledWith(3, [
      { nttSn: 30, title: '공지 30', createdAt: '2026-09-21' },
    ]);
  });

  it('새 글이 없으면 저장하지 않고 성공한다', async () => {
    repository.findCategoryById.mockResolvedValue(category({ lastNttSn: 30 }));
    client.fetch.mockResolvedValue(html([30, '2026.09.21']));

    await expect(job.run('3')).resolves.toBeUndefined();
    expect(repository.saveNew).not.toHaveBeenCalled();
  });

  it('target 없이 실행하면 에러를 던진다', async () => {
    await expect(job.run()).rejects.toThrow('target');
  });

  it('없는 카테고리나 학교 공지가 아닌 카테고리면 에러를 던진다', async () => {
    repository.findCategoryById.mockResolvedValueOnce(null);
    await expect(job.run('99')).rejects.toThrow('99');

    repository.findCategoryById.mockResolvedValueOnce(category({ departmentId: 5 }));
    await expect(job.run('3')).rejects.toThrow('학교 공지');
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('게시판 표를 못 읽으면 에러를 던지고 저장하지 않는다', async () => {
    client.fetch.mockResolvedValue('<html></html>');

    await expect(job.run('3')).rejects.toThrow('공지 목록 표를 찾을 수 없습니다.');
    expect(repository.saveNew).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --dir services/api/batch test -- university-notice.job`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 저장소 구현** (`notice.repository.ts`)

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NoticeCategory } from './domain/notice-category.entity';
import { Notice } from './domain/notice.entity';
import type { ParsedNotice } from './type/parsed-notice';

@Injectable()
export class NoticeRepository {
  constructor(
    @InjectRepository(NoticeCategory)
    private readonly categoryRepository: Repository<NoticeCategory>,
    private readonly dataSource: DataSource,
  ) {}

  findCategoriesByDepartmentId(departmentId: number): Promise<NoticeCategory[]> {
    return this.categoryRepository.find({
      where: { departmentId },
      order: { id: 'ASC' },
    });
  }

  findCategoryById(id: number): Promise<NoticeCategory | null> {
    return this.categoryRepository.findOne({ where: { id } });
  }

  /**
   * 새 공지를 누적 저장하고 카테고리의 last_ntt_sn을 올린다.
   * (category_id, ntt_sn) 유니크 인덱스 덕분에 재실행해도 중복이 생기지 않는다.
   */
  async saveNew(categoryId: number, notices: ParsedNotice[]): Promise<void> {
    if (notices.length === 0) return;

    const lastNttSn = Math.max(...notices.map((notice) => notice.nttSn));

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(Notice)
        .values(
          notices.map(({ nttSn, title, createdAt }) => ({
            categoryId,
            nttSn,
            title,
            createdAt,
          })),
        )
        .orIgnore()
        .execute();

      await manager.query(
        `UPDATE notice_category
         SET last_ntt_sn = GREATEST(last_ntt_sn, $2), updated_at = now()
         WHERE id = $1`,
        [categoryId, lastNttSn],
      );
    });
  }
}
```

- [ ] **Step 4: 잡 구현** (`university-notice.job.ts`)

```ts
import { Injectable } from '@nestjs/common';
import { BatchJob } from '../batch-job.interface';
import { NoticeClient } from './notice.client';
import { NoticeParser } from './notice.parser';
import { NoticeRepository } from './notice.repository';

/** notice_category.department_id 중 학교 공지(학과 공지가 아닌 것) */
const UNIVERSITY_DEPARTMENT_ID = 117;

@Injectable()
export class UniversityNoticeJob implements BatchJob {
  readonly name = 'university-notice';

  constructor(
    private readonly client: NoticeClient,
    private readonly parser: NoticeParser,
    private readonly repository: NoticeRepository,
  ) {}

  /** 게시판(카테고리)마다 scrape_run을 남기기 위해 카테고리 id를 대상으로 돌려준다. */
  async targets(): Promise<string[]> {
    const categories = await this.repository.findCategoriesByDepartmentId(
      UNIVERSITY_DEPARTMENT_ID,
    );
    return categories.map((category) => String(category.id));
  }

  async run(target?: string): Promise<void> {
    if (target === undefined) {
      throw new Error('university-notice 수집에는 target(카테고리 id)이 필요합니다.');
    }

    const categoryId = Number(target);
    if (!Number.isInteger(categoryId)) {
      throw new Error(`올바르지 않은 카테고리 id입니다: ${target}`);
    }

    const category = await this.repository.findCategoryById(categoryId);
    if (!category) {
      throw new Error(`공지 카테고리를 찾을 수 없습니다: ${target}`);
    }
    if (category.departmentId !== UNIVERSITY_DEPARTMENT_ID) {
      throw new Error(`학교 공지 카테고리가 아닙니다: ${target}`);
    }

    const raw = await this.client.fetch(category);
    const newNotices = this.parser
      .parse(raw)
      .filter((notice) => notice.nttSn > category.lastNttSn)
      .sort((a, b) => a.nttSn - b.nttSn);

    await this.repository.saveNew(category.id, newNotices);
  }
}
```

- [ ] **Step 5: 기존 골격 삭제와 모듈 등록**

```bash
git rm services/api/batch/src/batch/jobs/notice/notice.job.ts
```

`batch.module.ts`에서 `NoticeJob` import를 지우고 다음을 추가한다.

```ts
import { Notice } from './jobs/notice/domain/notice.entity';
import { NoticeCategory } from './jobs/notice/domain/notice-category.entity';
import { NoticeClient } from './jobs/notice/notice.client';
import { NoticeParser } from './jobs/notice/notice.parser';
import { NoticeRepository } from './jobs/notice/notice.repository';
import { UniversityNoticeJob } from './jobs/notice/university-notice.job';
```
`forFeature`에 `Notice, NoticeCategory`를 추가한다. providers에서 `NoticeJob`을 `NoticeClient, NoticeParser, NoticeRepository, UniversityNoticeJob`으로 바꾸고, `BATCH_JOBS` 팩토리의 `inject`를 `[ShuttleJob, CafeteriaJob, UniversityNoticeJob, AcademicCalendarJob]`로 바꾼다.

- [ ] **Step 6: 통과 확인**

Run: `pnpm --dir services/api/batch test`
Expected: 전체 PASS

Run: `pnpm --dir services/api/batch lint:check && pnpm --dir services/api/batch build`
Expected: 오류 없음

- [ ] **Step 7: 커밋**

```bash
git add -A services/api/batch
git commit -m "$(cat <<'EOF'
✨ feat: 학교 공지 수집 잡 구현 (카테고리별 scrape_run, 무제한 누적)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## PR 5 — 어드민 웹

### Task 10: 어드민 웹 — API 계층과 타입

**Files:**
- Modify: `admin/src/api/types.ts`
- Modify: `admin/src/api/adminClient.ts`
- Modify: `admin/src/api/adminClient.test.ts`
- Modify: `admin/src/features/scrapers/labels.ts`, `labels.test.ts`
- Modify: `admin/src/features/scrapers/searchParams.ts`, `searchParams.test.ts`
- Modify: `admin/src/test/fixtures.ts`

**Interfaces:**
- Consumes: Task 3의 응답 JSON.
- Produces:
  - `SCRAPE_RUN_TYPES = ['shuttle', 'university-notice', 'cafeteria', 'academic-calendar']`
  - `ScrapeRun.target: string | null`, `ScrapeRun.targetName: string | null`
  - `ScraperTargetStatus { target; targetName; latestRun; lastSucceededRun }`, `ScraperStatus.targets: ScraperTargetStatus[]`
  - `requestScrapeRun(apiKey, type, target?): Promise<ScrapeRun[]>`
  - `ListScrapeRunsParams.target?: string`
  - `parseTarget(value: string | null): string | undefined`, `summarizeTargets(targets: ScraperTargetStatus[]): string`

- [ ] **Step 1: 타입 변경** (`api/types.ts`)

```ts
export const SCRAPE_RUN_TYPES = [
  'shuttle',
  'university-notice',
  'cafeteria',
  'academic-calendar',
] as const;
```
`ScrapeRun`에 `type` 필드 뒤로 두 필드를 추가하고, `ScraperStatus` 주변을 바꾼다.

```ts
export interface ScrapeRun {
  id: number;
  type: ScrapeRunType;
  /** 수집 대상 id(식당, 공지 카테고리). 대상 없는 타입은 null */
  target: string | null;
  /** 수집 대상 이름 */
  targetName: string | null;
  trigger: ScrapeRunTrigger;
  status: ScrapeRunStatus;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ScraperTargetStatus {
  target: string;
  targetName: string;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
}

export interface ScraperStatus {
  type: ScrapeRunType;
  latestRun: ScrapeRun | null;
  lastSucceededRun: ScrapeRun | null;
  /** 대상 없이 도는 타입은 빈 배열 */
  targets: ScraperTargetStatus[];
}
```
`ListScrapeRunsParams`에 `target?: string;`을 추가한다.

- [ ] **Step 2: 픽스처 변경** (`test/fixtures.ts`)

`makeRun`의 기본값에 `target: null, targetName: null,`를 `type: 'shuttle',` 다음 줄에 추가하고, `makeStatus`를 바꾼다.

```ts
export function makeStatus(
  type: ScrapeRunType,
  latestRun: ScrapeRun | null,
  lastSucceededRun: ScrapeRun | null = latestRun?.status === 'succeeded' ? latestRun : null,
  targets: ScraperTargetStatus[] = [],
): ScraperStatus {
  return { type, latestRun, lastSucceededRun, targets };
}
```
파일 상단 import에 `type ScraperTargetStatus`를 추가한다.

- [ ] **Step 3: 실패하는 테스트 작성/수정**

`api/adminClient.test.ts`의 '수동 실행은 JSON 본문으로 POST 한다' 테스트를 교체하고 target 테스트를 추가한다.

```ts
  it('수동 실행은 JSON 본문으로 POST 하고 등록된 run 목록을 돌려준다', async () => {
    const run = makeRun({ status: 'pending', trigger: 'manual' });
    const fetchMock = mockFetch().mockResolvedValue(ok({ runs: [run] }, 202));

    await expect(requestScrapeRun('k', 'shuttle')).resolves.toEqual([run]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/scrape-runs');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ type: 'shuttle' });
  });

  it('대상을 지정한 수동 실행은 target도 본문에 담는다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok({ runs: [] }, 202));

    await requestScrapeRun('k', 'cafeteria', '3');

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ type: 'cafeteria', target: '3' });
  });

  it('목록 조회는 target도 쿼리로 보낸다', async () => {
    const fetchMock = mockFetch().mockResolvedValue(ok({ items: [], nextCursor: null }));

    await listScrapeRuns('k', { type: 'cafeteria', target: '3' });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/scrape-runs?type=cafeteria&target=3');
  });
```

`features/scrapers/labels.test.ts`에 추가한다. 파일 상단 import에 `summarizeTargets`를 추가한다(`makeRun`은 이미 import돼 있다).

```ts
  it('학교 공지는 university-notice 타입의 라벨이다', () => {
    expect(TYPE_LABELS['university-notice']).toBe('학교 공지');
  });

  it('대상별 상태를 한 줄로 요약한다', () => {
    const target = (id: string, run: ReturnType<typeof makeRun> | null) => ({
      target: id,
      targetName: `식당${id}`,
      latestRun: run,
      lastSucceededRun: null,
    });

    expect(
      summarizeTargets([
        target('1', makeRun({ status: 'succeeded' })),
        target('2', makeRun({ status: 'succeeded' })),
        target('3', makeRun({ status: 'failed' })),
        target('4', makeRun({ status: 'running' })),
        target('5', null),
      ]),
    ).toBe('성공 2 · 실패 1 · 진행 중 1 · 기록 없음 1');
    expect(summarizeTargets([target('1', makeRun({ status: 'succeeded' }))])).toBe('성공 1 · 실패 0');
  });
```

`features/scrapers/searchParams.test.ts`에 추가한다(`describe` 구조는 기존 파일에 맞춘다. 파일 상단 import에 `parseTarget`을 추가한다).

```ts
describe('parseTarget', () => {
  it('영숫자·밑줄·하이픈 50자 이하만 대상 id로 받는다', () => {
    expect(parseTarget('12')).toBe('12');
    expect(parseTarget('dept_1-a')).toBe('dept_1-a');
    expect(parseTarget(null)).toBeUndefined();
    expect(parseTarget('')).toBeUndefined();
    expect(parseTarget('1 OR 1=1')).toBeUndefined();
    expect(parseTarget('a'.repeat(51))).toBeUndefined();
  });
});
```

- [ ] **Step 4: 실패 확인**

Run: `pnpm --dir admin exec vitest run src/api src/features/scrapers/labels.test.ts src/features/scrapers/searchParams.test.ts`
Expected: FAIL (`requestScrapeRun` 반환 형식, `summarizeTargets`, `parseTarget`, `TYPE_LABELS['university-notice']`).

- [ ] **Step 5: 구현**

`api/adminClient.ts`의 `requestScrapeRun`을 바꾼다.

```ts
export async function requestScrapeRun(
  apiKey: string,
  type: ScrapeRunType,
  target?: string,
): Promise<ScrapeRun[]> {
  const body = target === undefined ? { type } : { type, target };
  const data = await request<{ runs: ScrapeRun[] }>(apiKey, '/scrape-runs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.runs;
}
```

`features/scrapers/labels.ts`를 바꾼다(`ScraperTargetStatus` import 추가).

```ts
export const TYPE_LABELS: Record<ScrapeRunType, string> = {
  shuttle: '셔틀',
  'university-notice': '학교 공지',
  cafeteria: '학식',
  'academic-calendar': '학사 일정',
};

export const TYPE_ICONS: Record<ScrapeRunType, IconName> = {
  shuttle: 'bus',
  'university-notice': 'bell',
  cafeteria: 'meal',
  'academic-calendar': 'calendar',
};
```
파일 끝에 추가:

```ts
/** 대상별 최근 상태를 "성공 11 · 실패 1 · 진행 중 2 · 기록 없음 3" 꼴로 요약한다. 0인 진행 중·기록 없음은 생략한다. */
export function summarizeTargets(targets: ScraperTargetStatus[]): string {
  let succeeded = 0;
  let failed = 0;
  let inProgress = 0;
  let none = 0;

  for (const { latestRun } of targets) {
    if (latestRun === null) none += 1;
    else if (isInProgress(latestRun)) inProgress += 1;
    else if (latestRun.status === 'failed') failed += 1;
    else succeeded += 1;
  }

  const parts = [`성공 ${succeeded}`, `실패 ${failed}`];
  if (inProgress > 0) parts.push(`진행 중 ${inProgress}`);
  if (none > 0) parts.push(`기록 없음 ${none}`);
  return parts.join(' · ');
}
```

`features/scrapers/searchParams.ts`에 추가:

```ts
export function parseTarget(value: string | null): string | undefined {
  return value && /^[A-Za-z0-9_-]{1,50}$/.test(value) ? value : undefined;
}
```

- [ ] **Step 6: 남은 옛 타입 이름 정리**

Run: `grep -rn "'notice'\|\"notice\"\|공지사항" admin/src`
Expected: 테스트 파일에 남은 `'notice'`(타입 값)와 `'공지사항'`(카드 이름)이 나온다. 타입 값은 `'university-notice'`로, 카드 이름은 `'학교 공지'`로 바꾼다. (`ScraperCard.test.tsx`의 `makeStatus('notice', makeRun({ type: 'notice', … }))`, `ScrapersPage.test.tsx`의 `notice:` 키·`'공지사항'` 라벨·메시지 문자열 `'notice' 수집이…`이 대상이다.)
`ScrapersPage.test.tsx`의 POST 핸들러 두 곳은 응답 형식이 바뀌었으므로 다음처럼 고친다.
- `return ok(pending, 202);` → `return ok({ runs: [pending] }, 202);`
- `resolve(ok(makeRun({ status: 'pending' }), 202))` → `resolve(ok({ runs: [makeRun({ status: 'pending' })] }, 202))`

- [ ] **Step 7: 통과 확인**

Run: `pnpm --dir admin test`
Expected: 전체 PASS

Run: `pnpm --dir admin build`
Expected: `tsc --noEmit`과 vite build가 오류 없이 끝난다.

- [ ] **Step 8: 커밋**

```bash
git add admin
git commit -m "$(cat <<'EOF'
✨ feat: 어드민 웹 API 계층에 수집 대상(target) 반영

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: 어드민 웹 — 대상별 카드, 실행 기록 대상 표시

**Files:**
- Modify: `admin/src/features/scrapers/ScraperCard.tsx`, `ScraperCard.test.tsx`
- Modify: `admin/src/pages/ScrapersPage.tsx`, `ScrapersPage.test.tsx`
- Modify: `admin/src/features/scrapers/RunTable.tsx`, `RunDetailPanel.tsx`
- Modify: `admin/src/pages/ScrapeRunsPage.tsx`, `ScrapeRunsPage.test.tsx`
- Modify: `admin/src/design/admin.css`

**Interfaces:**
- Consumes: Task 10의 타입·`requestScrapeRun`·`summarizeTargets`·`parseTarget`
- Produces: `ScraperCard`의 새 props `requestingTarget?: string | null`, `onRequest(type, target?)`

- [ ] **Step 1: ScraperCard — 실패하는 테스트 작성** (`ScraperCard.test.tsx`)

`renderCard`의 props 타입과 렌더를 확장한다.

```tsx
function renderCard(
  status: ScraperStatus,
  props: Partial<{
    requesting: boolean;
    requestingTarget: string | null;
    notice: string | null;
    onRequest: () => void;
  }> = {},
) {
  const onRequest = props.onRequest ?? vi.fn();
  render(
    <MemoryRouter future={ROUTER_FUTURE}>
      <ScraperCard
        status={status}
        now={NOW}
        requesting={props.requesting ?? false}
        requestingTarget={props.requestingTarget ?? null}
        notice={props.notice ?? null}
        onRequest={onRequest}
      />
    </MemoryRouter>,
  );
  return { onRequest };
}
```

`describe('ScraperCard', …)` 안에 추가한다.

```tsx
  describe('대상이 있는 타입', () => {
    const target = (id: string, name: string, status: 'succeeded' | 'failed' | 'running' | null) => ({
      target: id,
      targetName: name,
      latestRun: status
        ? makeRun({
            id: Number(id),
            type: 'cafeteria',
            target: id,
            targetName: name,
            status,
            ...(status === 'running' ? { finishedAt: null } : {}),
          })
        : null,
      lastSucceededRun: null,
    });
    const cafeteriaStatus = () =>
      makeStatus('cafeteria', makeRun({ type: 'cafeteria' }), null, [
        target('1', '아람관', 'succeeded'),
        target('2', '교육문화식당', 'failed'),
        target('3', '가좌식당', 'running'),
      ]);

    it('대상별 상태 요약을 보여 주고 버튼 이름을 전체 수집으로 바꾼다', () => {
      renderCard(cafeteriaStatus());

      expect(screen.getByText('성공 1 · 실패 1 · 진행 중 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '전체 수집' })).toBeEnabled();
    });

    it('대상마다 이름 링크·상태·수집 버튼을 보여 주고 대상별 실행 기록으로 연결한다', () => {
      renderCard(cafeteriaStatus());

      expect(screen.getByRole('link', { name: '아람관' })).toHaveAttribute(
        'href',
        '/scrape-runs?type=cafeteria&target=1',
      );
      expect(screen.getByRole('button', { name: '아람관 수집' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '가좌식당 수집' })).toBeDisabled();
    });

    it('대상의 수집 버튼을 누르면 타입과 대상을 넘긴다', async () => {
      const user = userEvent.setup();
      const { onRequest } = renderCard(cafeteriaStatus());

      await user.click(screen.getByRole('button', { name: '교육문화식당 수집' }));

      expect(onRequest).toHaveBeenCalledWith('cafeteria', '2');
    });

    it('전체 수집을 누르면 타입만 넘긴다', async () => {
      const user = userEvent.setup();
      const { onRequest } = renderCard(cafeteriaStatus());

      await user.click(screen.getByRole('button', { name: '전체 수집' }));

      expect(onRequest).toHaveBeenCalledWith('cafeteria');
    });

    it('모든 대상이 진행 중이면 전체 수집을 막는다', () => {
      renderCard(
        makeStatus('cafeteria', makeRun({ type: 'cafeteria', status: 'running', finishedAt: null }), null, [
          target('1', '아람관', 'running'),
        ]),
      );

      expect(screen.getByRole('button', { name: '수집 중…' })).toBeDisabled();
    });

    it('한 대상의 요청을 보내는 동안 그 대상 버튼만 막는다', () => {
      renderCard(cafeteriaStatus(), { requestingTarget: '2' });

      expect(screen.getByRole('button', { name: '교육문화식당 수집' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '아람관 수집' })).toBeEnabled();
    });
  });
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --dir admin exec vitest run src/features/scrapers/ScraperCard.test.tsx`
Expected: FAIL (새 props·버튼 없음).

- [ ] **Step 3: ScraperCard 구현** (`ScraperCard.tsx`를 교체)

```tsx
import { Link } from 'react-router-dom';
import type { ScrapeRunType, ScraperStatus } from '../../api/types';
import { Badge, Button, Card, Icon, Notice } from '../../design/components';
import { formatDateTime, formatDuration } from './format';
import {
  NO_RUN_VIEW,
  STATUS_VIEWS,
  TRIGGER_LABELS,
  TYPE_ICONS,
  TYPE_LABELS,
  isInProgress,
  summarizeTargets,
} from './labels';

interface ScraperCardProps {
  status: ScraperStatus;
  now: Date;
  /** 타입 전체(또는 대상 없는 타입) 요청을 보내는 중인지 */
  requesting: boolean;
  /** 대상 하나의 요청을 보내는 중이면 그 대상 */
  requestingTarget?: string | null;
  /** 카드 안에 띄울 안내(409 등) */
  notice: string | null;
  onRequest(type: ScrapeRunType, target?: string): void;
}

export function ScraperCard({
  status,
  now,
  requesting,
  requestingTarget = null,
  notice,
  onRequest,
}: ScraperCardProps) {
  const { type, latestRun, lastSucceededRun, targets } = status;
  const view = latestRun ? STATUS_VIEWS[latestRun.status] : NO_RUN_VIEW;
  const hasTargets = targets.length > 0;
  // 대상이 있으면 모든 대상이 진행 중일 때만 전체 수집을 막는다
  const inProgress = hasTargets
    ? targets.every(item => isInProgress(item.latestRun))
    : isInProgress(latestRun);
  const lastSuccessAt = lastSucceededRun?.finishedAt ?? lastSucceededRun?.createdAt;
  const busy = inProgress || requesting || requestingTarget !== null;

  return (
    <Card
      className="ad-scraper-card"
      eyebrow={
        <span className="ad-card-icon">
          <Icon name={TYPE_ICONS[type]} />
        </span>
      }
      title={TYPE_LABELS[type]}
      action={
        <Badge tone={view.tone} icon={view.icon}>
          {view.label}
        </Badge>
      }
    >
      <dl className="ad-info">
        <dt>최근 실행</dt>
        <dd>
          {latestRun
            ? `${formatDateTime(latestRun.createdAt, now)} · ${TRIGGER_LABELS[latestRun.trigger]}`
            : '-'}
        </dd>
        <dt>소요</dt>
        <dd>{latestRun ? formatDuration(latestRun.startedAt, latestRun.finishedAt) : '-'}</dd>
        <dt>마지막 성공</dt>
        <dd>{lastSuccessAt ? formatDateTime(lastSuccessAt, now) : '아직 없어요'}</dd>
      </dl>

      {hasTargets && (
        <details className="ad-target-list">
          <summary>{summarizeTargets(targets)}</summary>
          <ul>
            {targets.map(item => {
              const itemView = item.latestRun ? STATUS_VIEWS[item.latestRun.status] : NO_RUN_VIEW;
              const itemBusy =
                isInProgress(item.latestRun) || requesting || requestingTarget === item.target;
              return (
                <li key={item.target} className="ad-target-row">
                  <Link className="ad-link" to={`/scrape-runs?type=${type}&target=${item.target}`}>
                    {item.targetName}
                  </Link>
                  <Badge tone={itemView.tone} icon={itemView.icon}>
                    {itemView.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={itemBusy}
                    aria-label={`${item.targetName} 수집`}
                    onClick={() => onRequest(type, item.target)}
                  >
                    수집
                  </Button>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {latestRun?.status === 'failed' && (
        <Notice tone="danger" title="수집 실패">
          <p className="ad-clamp-3">{latestRun.errorMessage || '오류 메시지가 없어요.'}</p>
          <Link className="ad-link" to={`/scrape-runs?type=${type}&run=${latestRun.id}`}>
            실행 기록에서 전체 보기
          </Link>
        </Notice>
      )}

      {notice && <Notice>{notice}</Notice>}

      <Button
        variant="soft"
        block
        icon={busy ? undefined : 'refresh'}
        disabled={busy}
        onClick={() => onRequest(type)}
      >
        {requesting || requestingTarget !== null
          ? '요청하는 중…'
          : inProgress
            ? '수집 중…'
            : hasTargets
              ? '전체 수집'
              : '지금 수집'}
      </Button>
    </Card>
  );
}
```

`design/admin.css` 끝에 추가한다.

```css
.ad-target-list summary {
  cursor: pointer;
}

.ad-target-list ul {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.ad-target-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
}
```

- [ ] **Step 4: ScrapersPage — 테스트 추가** (`ScrapersPage.test.tsx`의 `describe` 안, 기존 `it` 뒤)

```tsx
  it('대상별 수집 버튼은 타입과 대상을 함께 요청한다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrapers': () =>
        ok(
          allStatuses({
            cafeteria: makeStatus('cafeteria', makeRun({ type: 'cafeteria' }), null, [
              { target: '2', targetName: '교육문화식당', latestRun: makeRun({ type: 'cafeteria', target: '2' }), lastSucceededRun: null },
            ]),
          }),
        ),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      'POST /api/admin/scrape-runs': () => ok({ runs: [makeRun({ status: 'pending' })] }, 202),
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await screen.findByRole('heading', { name: '학식', level: 3 });
    await user.click(within(card('학식')).getByRole('button', { name: '교육문화식당 수집' }));

    const posts = callsTo(fetchMock, 'POST', '/api/admin/scrape-runs');
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0][1].body as string)).toEqual({ type: 'cafeteria', target: '2' });
  });

  it('대상이 있는 카드의 전체 수집은 target 없이 요청한다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrapers': () =>
        ok(
          allStatuses({
            cafeteria: makeStatus('cafeteria', makeRun({ type: 'cafeteria' }), null, [
              { target: '2', targetName: '교육문화식당', latestRun: makeRun({ type: 'cafeteria', target: '2' }), lastSucceededRun: null },
            ]),
          }),
        ),
      'GET /api/admin/scrape-runs': () => ok({ items: [], nextCursor: null }),
      'POST /api/admin/scrape-runs': () => ok({ runs: [makeRun({ status: 'pending' })] }, 202),
    });
    const user = userEvent.setup();
    renderApp('/scrapers', { apiKey: 'k' });

    await screen.findByRole('heading', { name: '학식', level: 3 });
    await user.click(within(card('학식')).getByRole('button', { name: '전체 수집' }));

    const posts = callsTo(fetchMock, 'POST', '/api/admin/scrape-runs');
    expect(JSON.parse(posts[0][1].body as string)).toEqual({ type: 'cafeteria' });
  });
```

- [ ] **Step 5: ScrapersPage 구현** (`pages/ScrapersPage.tsx`)

1. `toCards`의 기본값에 `targets: []`를 추가한다.

```tsx
function toCards(statuses: ScraperStatus[]): ScraperStatus[] {
  return SCRAPE_RUN_TYPES.map(
    type =>
      statuses.find(status => status.type === type) ?? {
        type,
        latestRun: null,
        lastSucceededRun: null,
        targets: [],
      },
  );
}
```

2. 요청 중 상태를 타입과 대상으로 들고 간다.

```tsx
  const [requesting, setRequesting] = useState<{ type: ScrapeRunType; target?: string } | null>(
    null,
  );
```

3. `handleRequest`를 바꾼다.

```tsx
  async function handleRequest(type: ScrapeRunType, target?: string) {
    if (requestingRef.current) return;
    requestingRef.current = true;
    setRequesting({ type, target });
    setNotices(prev => ({ ...prev, [type]: undefined }));
    try {
      await requestScrapeRun(apiKey, type, target);
      await load();
    } catch (err) {
      if (err instanceof ConflictError) setNotices(prev => ({ ...prev, [type]: CONFLICT_NOTICE }));
      else handleError(err);
    } finally {
      requestingRef.current = false;
      setRequesting(null);
    }
  }
```

4. 카드에 넘기는 props를 바꾼다.

```tsx
              <ScraperCard
                key={status.type}
                status={status}
                now={now}
                requesting={requesting?.type === status.type && requesting.target === undefined}
                requestingTarget={
                  requesting?.type === status.type ? (requesting.target ?? null) : null
                }
                notice={notices[status.type] ?? null}
                onRequest={handleRequest}
              />
```

- [ ] **Step 6: 실행 기록 화면 — 테스트 추가** (`ScrapeRunsPage.test.tsx`)

기존 테스트 파일의 스타일(`routeFetch`, `renderApp`)에 맞춰 추가한다. 파일 상단 import에 `callsTo`, `makeRun`이 없으면 추가한다.

```tsx
  it('주소의 target을 서버에 넘기고 대상 이름과 해제 버튼을 보여 준다', async () => {
    const fetchMock = routeFetch({
      'GET /api/admin/scrape-runs': () =>
        ok({
          items: [makeRun({ id: 5, type: 'cafeteria', target: '2', targetName: '교육문화식당' })],
          nextCursor: null,
        }),
    });
    renderApp('/scrape-runs?type=cafeteria&target=2', { apiKey: 'k' });

    expect(await screen.findByText(/교육문화식당의 기록만 보고 있어요/)).toBeInTheDocument();
    expect(callsTo(fetchMock, 'GET', '/api/admin/scrape-runs')[0][0]).toBe(
      '/api/admin/scrape-runs?type=cafeteria&target=2&limit=20',
    );
    expect(screen.getByRole('button', { name: '대상 필터 해제' })).toBeInTheDocument();
  });
```
(`listScrapeRuns`가 파라미터를 객체 순서대로 쿼리에 넣으므로, 화면이 `{ type, target, status, limit }` 순서로 넘겨야 위 URL이 된다. Step 7의 구현이 이 순서를 따른다.)

- [ ] **Step 7: 실행 기록 구현**

`features/scrapers/RunTable.tsx`의 `columns`에서 `type` 열 다음에 추가한다.

```tsx
    {
      key: 'target',
      header: '대상',
      render: run => run.targetName ?? run.target ?? '-',
    },
```

`features/scrapers/RunDetailPanel.tsx`의 표에서 `타입` 행 다음에 추가한다.

```tsx
            <tr>
              <th scope="row">대상</th>
              <td>{run.targetName ?? run.target ?? '-'}</td>
            </tr>
```

`pages/ScrapeRunsPage.tsx`를 수정한다.

1. import에 `parseTarget`을 추가한다: `import { parseRunId, parseStatus, parseTarget, parseType } from '../features/scrapers/searchParams';`
2. `const type = parseType(params.get('type'));` 다음 줄에 `const target = parseTarget(params.get('target'));`를 추가한다.
3. `filterKey`를 `` `${type ?? ''}|${target ?? ''}|${status ?? ''}|${reloadToken}` ``로 바꾼다.
4. 첫 조회의 `listScrapeRuns(apiKey, { type, status, limit: PAGE_SIZE })`를 `listScrapeRuns(apiKey, { type, target, status, limit: PAGE_SIZE })`로, 효과 의존성 배열을 `[apiKey, type, target, status, reloadToken, handleError]`로 바꾼다.
5. `loadMore`의 호출을 `listScrapeRuns(apiKey, { type, target, status, cursor: nextCursor, limit: PAGE_SIZE })`로 바꾼다.
6. `updateParam`의 키 타입을 `'type' | 'target' | 'status' | 'run'`으로 넓히고, 타입을 바꾸면 대상 필터를 함께 지운다.

```tsx
  const updateParam = useCallback(
    (key: 'type' | 'target' | 'status' | 'run', value: string | null) => {
      setParams(prev => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, value);
        // 다른 타입으로 바꾸면 이전 타입의 대상 필터는 의미가 없다
        if (key === 'type') next.delete('target');
        return next;
      });
    },
    [setParams],
  );
```
7. `const hasFilter = Boolean(type || status);`를 `Boolean(type || target || status)`로 바꾼다.
8. `<div className="ad-filters">…</div>` 바로 뒤에 추가한다.

```tsx
      {target && (
        <Notice>
          {items[0]?.targetName ?? `대상 #${target}`}의 기록만 보고 있어요.{' '}
          <Button variant="ghost" size="sm" onClick={() => updateParam('target', null)}>
            대상 필터 해제
          </Button>
        </Notice>
      )}
```

- [ ] **Step 8: 통과 확인**

Run: `pnpm --dir admin test`
Expected: 전체 PASS. 기존 `RunTable`·`RunDetailPanel` 테스트가 열 개수나 행 수를 단정하고 있어 실패하면, 새 `대상` 열·행을 반영하도록 그 단정만 고친다(동작을 되돌리지 않는다).

Run: `pnpm --dir admin build`
Expected: `tsc --noEmit`과 vite build 통과.

- [ ] **Step 9: 커밋**

```bash
git add admin
git commit -m "$(cat <<'EOF'
✨ feat: 어드민 웹에서 수집 대상별 상태 확인과 재실행

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## 마무리

### Task 12: 전체 검증과 문서 정리

**Files:**
- Modify: `docs/superpowers/specs/2026-09-26-data-scraping-design.md` (남은 확인 사항 정리)

- [ ] **Step 1: 전체 테스트·린트·빌드**

Run: `pnpm test`
Expected: `test:api`, `test:mobile`, `test:admin` 모두 PASS

Run:
```bash
pnpm --dir services/api/batch lint:check && pnpm --dir services/api/batch build
pnpm --dir services/api/app lint:check && pnpm --dir services/api/app build
pnpm --dir admin build
```
Expected: 모두 오류 없음

- [ ] **Step 2: 로컬 통합 확인** (Docker 필요)

1. `supabase db reset`으로 마이그레이션·시드 적용
2. 배치를 로컬 DB로 띄워(`services/api/batch`의 `pnpm start`, `.env`는 `services/api/.env.example` 참고) 정각 cron 대신 `onApplicationBootstrap`의 첫 실행을 관찰한다.
3. 확인 쿼리:
```sql
select type, target, status, error_message from scrape_run order by id desc limit 30;
select cafeteria_id, min(date), max(date), count(*) from cafeteria_diet group by 1;
select count(*) from academic_calendar;
select category_id, count(*), max(ntt_sn) from notice group by 1;
```
Expected: 식당·공지 카테고리마다 `scrape_run` 행이 생긴다. 한 대상이 실패(`failed`)해도 다른 대상은 `succeeded`다. 배치를 한 번 더 재시작해도 `notice` 건수가 늘지 않는다(멱등). 실패가 있으면 `error_message`로 원인을 확인해 고친다.

- [ ] **Step 3: 스펙 8절 정리**

스펙의 "8. 남은 확인 사항"을 확인 결과로 바꾼다.
- `cafeteria_repository.py`는 식단 삽입 후 `cafeteria.last_date`를 마지막 식단의 날짜로 갱신한다 → 이식했다(`CafeteriaRepository.replaceWeek`가 같은 트랜잭션에서 최신 식단 날짜로 갱신).
- 학사일정 POST는 세션·쿠키 없이 동작함을 Task 5 Step 12에서 확인했다. 사이트가 바뀌어도 0건 가드가 실패로 잡는다.
- 5.2의 "종료일이 어제 이전이면 제외"는 Python과 같은 동작(종료일이 오늘보다 이르면 제외, 즉 어제 종료도 제외)으로 구현했다고 한 줄로 명시한다.

- [ ] **Step 4: 커밋**

```bash
git add docs/superpowers/specs/2026-09-26-data-scraping-design.md
git commit -m "$(cat <<'EOF'
📝 docs: 수집 배치 스펙의 남은 확인 사항 정리

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: 운영 전환 체크리스트를 PR 본문에 남긴다**

- 마이그레이션 적용과 API·배치 배포는 같은 릴리스에서 진행한다(구버전 배치의 `notice` 타입 run이 새 제약에 걸릴 수 있음).
- 잡을 켤 때마다 같은 날 `GNU-connect/web-scraping`의 해당 GitHub Actions 스케줄(`schedule_academic_calendar`, `schedule_cafeteria`, `schedule_notice`)을 끈다.
- Slack 실패 알림은 이번 범위 밖이다. 어드민의 `failed` 표시로 확인한다.
