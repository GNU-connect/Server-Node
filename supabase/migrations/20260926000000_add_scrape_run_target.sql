-- 대상(target)별 수집 run: 식당, 공지 게시판 등
alter table scrape_run add column target varchar(50);

-- 타입 이름 변경: notice -> university-notice (학과 공지는 나중에 department-notice로 추가)
alter table scrape_run drop constraint scrape_run_type_check;
-- 배포 시점에 대기/실행 중이던 옛 notice run은 대상(target)이 없어 새 배치가 처리할 수 없으므로 먼저 실패 처리한다.
update scrape_run
    set status = 'failed',
        finished_at = now(),
        error_message = '수집 대상(target) 도입 마이그레이션으로 중단됨'
    where type = 'notice' and status in ('pending', 'running');
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
