-- 학교 공지(department_id 117) 수집 대상. seed.sql 다음에 실행된다(college 1번 참조).
-- 학술/행사(mi=1131, bbsId=1032)는 목록이 아니라 달력형 게시판이라 공지 목록 파서 대상이 아니다.
INSERT INTO "public"."department" ("id", "college_id", "department_ko", "department_en", "is_active") VALUES
  (117, 1, '경상국립대학교', 'main', true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "public"."notice_category" ("department_id", "category", "mi", "bbs_id")
SELECT v.department_id, v.category, v.mi, v.bbs_id
FROM (VALUES
  (117, '학사', 1127, 1029),
  (117, '공지사항', 1126, 1028),
  (117, '장학', 1376, 1075),
  (117, '교내채용', 1129, 1030)
) AS v (department_id, category, mi, bbs_id)
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."notice_category" c
  WHERE c.department_id = v.department_id AND c.category = v.category
);
