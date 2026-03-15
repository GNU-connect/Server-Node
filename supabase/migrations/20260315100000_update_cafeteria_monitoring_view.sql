drop view if exists monitoring_cafeteria_status;

create view monitoring_cafeteria_status as
select
    campus.campus_name_ko || ' ' || cafeteria.cafeteria_name_ko as name,
    cafeteria.last_date,
    GREATEST(0, current_date - cafeteria.last_date) as lag_days
from cafeteria
join campus on cafeteria.campus_id = campus.id;
