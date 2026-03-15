-- campus.sql
INSERT INTO "public"."campus" ("id", "campus_name_ko", "thumbnail_url") VALUES
  (1, '가좌캠퍼스', 'https://ojsfile.ohmynews.com/PHT_IMG_FILE/2023/0620/IE003166916_PHT.jpg')
ON CONFLICT ("id") DO UPDATE
  SET "campus_name_ko" = EXCLUDED."campus_name_ko",
      "thumbnail_url"  = EXCLUDED."thumbnail_url";

-- college.sql
INSERT INTO "public"."college" ("id", "college_ko", "college_en", "etc_value", "campus_id", "thumbnail_url") VALUES
  (1, '인문대학', 'inmun', false, 1, 'https://www.gnu.ac.kr/images/web/main/sub_cnt/as_1_14.png')
ON CONFLICT ("id") DO UPDATE
  SET "college_ko" = EXCLUDED."college_ko",
      "college_en" = EXCLUDED."college_en",
      "etc_value" = EXCLUDED."etc_value",
      "campus_id" = EXCLUDED."campus_id",
      "thumbnail_url" = EXCLUDED."thumbnail_url";

--cafeteria.sql
INSERT INTO "public"."cafeteria" ("id", "cafeteria_name_ko", "campus_id", "mi", "rest_seq", "type", "sch_sys_id", "form_type", "last_date", "thumbnail_url") VALUES
  (1, '아람관', 1, 7278, 47, 'dorm', '', 1, '2026-03-22', 'https://www.gnu.ac.kr/upload//campus/img_c3bdec74-8530-4cce-a492-aac38e7375aa1667882180927.jpg')
ON CONFLICT ("id") DO UPDATE
  SET "cafeteria_name_ko" = EXCLUDED."cafeteria_name_ko",
      "campus_id" = EXCLUDED."campus_id",
      "mi" = EXCLUDED."mi",
      "rest_seq" = EXCLUDED."rest_seq",
      "type" = EXCLUDED."type",
      "sch_sys_id" = EXCLUDED."sch_sys_id",
      "form_type" = EXCLUDED."form_type",
      "last_date" = EXCLUDED."last_date",
      "thumbnail_url" = EXCLUDED."thumbnail_url";

--shuttle_timetable.sql
INSERT INTO "public"."shuttle_timetable" ("id", "route_name", "timetable", "updated_at", "last_success_at") OVERRIDING SYSTEM VALUE VALUES
  (1, '가좌캠퍼스 → 칠암캠퍼스', '{"오전": ["08:20", "09:00(금요일 미운행)", "09:30", "09:50", "10:00(금요일 미운행)", "10:30", "10:40", "11:00", "11:30"], "오후": ["13:10(금요일 미운행)", "13:40", "13:50", "14:00", "14:40", "14:50", "15:00", "15:30", "16:00", "16:10", "16:30", "16:40", "17:30"]}', '2026-03-13 09:47:30.000000', '2026-03-14 14:46:06.972760')
ON CONFLICT ("id") DO UPDATE
  SET "route_name" = EXCLUDED."route_name",
      "timetable" = EXCLUDED."timetable",
      "updated_at" = EXCLUDED."updated_at",
      "last_success_at" = EXCLUDED."last_success_at";