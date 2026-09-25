create table scrape_run (
    id bigint generated always as identity primary key,
    type varchar(30) not null
        check (type in ('shuttle', 'notice', 'cafeteria', 'academic-calendar')),
    trigger varchar(10) not null
        check (trigger in ('cron', 'manual')),
    status varchar(10) not null default 'pending'
        check (status in ('pending', 'running', 'succeeded', 'failed')),
    error_message text,
    created_at timestamptz not null default now(),
    started_at timestamptz,
    finished_at timestamptz
);

-- 타입별로 대기/실행 중인 run은 하나만 존재할 수 있다 (cron·수동 실행 공통 락)
create unique index scrape_run_active_type_uq
    on scrape_run (type)
    where status in ('pending', 'running');

create index scrape_run_type_id_idx on scrape_run (type, id desc);
