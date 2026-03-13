create table shuttle_timetable (
    id bigint generated always as identity primary key,
    route_name varchar(100) not null unique,
    timetable jsonb not null,
    updated_at timestamp not null default now()
);