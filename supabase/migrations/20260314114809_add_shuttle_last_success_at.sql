alter table shuttle_timetable
    add column last_success_at timestamp not null default now();
