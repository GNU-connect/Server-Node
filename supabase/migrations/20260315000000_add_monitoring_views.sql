create or replace view monitoring_cafeteria_status as
select
    cafeteria_name_ko,
    last_date,
    GREATEST(0, current_date - last_date) as lag_days
from cafeteria;

create or replace view monitoring_shuttle_status as
select
    route_name,
    updated_at,
    last_success_at,
    round(extract(epoch from (now() - last_success_at)) / 60) as minutes_since_success,
    case
        when now() - last_success_at > interval '1 hours' then 'DELAYED'
        else 'OK'
    end as status
from shuttle_timetable;
