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
