-- Migration de synchronisation du drift causé par les index partiels,
-- GiST et contraintes Postgres non exprimables nativement dans schema.prisma
-- (créés par les scripts post-migrate).
-- Ces index existent déjà en base de données.

-- Course (30_academic.sql)
CREATE UNIQUE INDEX IF NOT EXISTS "course_active_unique_idx"
  ON "public"."Course" ("classId", "ueCourseId")
  WHERE "deletedAt" IS NULL;

-- Justification (50_attendance.sql)
CREATE UNIQUE INDEX IF NOT EXISTS "justification_pending_unique_idx"
  ON "public"."Justification" ("scheduleId", "studentId")
  WHERE status = 'PENDING';

-- Location (40_schedule.sql)
CREATE INDEX IF NOT EXISTS "location_position_idx"
  ON "public"."Location" USING GIST ("position");

-- Permission (10_tenant.sql)
CREATE UNIQUE INDEX IF NOT EXISTS "permission_user_scope_unique_idx"
  ON "public"."Permission" ("userId", "action", "resource", "resourceId", "orgId")
  NULLS NOT DISTINCT;

CREATE UNIQUE INDEX IF NOT EXISTS "permission_function_scope_unique_idx"
  ON "public"."Permission" ("functionId", "action", "resource", "resourceId", "orgId")
  NULLS NOT DISTINCT;

-- Schedule (40_schedule.sql)
CREATE INDEX IF NOT EXISTS "schedule_during_gist_idx"
  ON "public"."Schedule" USING GIST ("during");

-- Session (50_attendance.sql)
CREATE INDEX IF NOT EXISTS "session_position_idx"
  ON "public"."Session" USING GIST ("position");

-- UECourse (30_academic.sql)
CREATE UNIQUE INDEX IF NOT EXISTS "uecourse_active_name_unique_idx"
  ON "public"."UECourse" ("name", "ueId")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "uecourse_active_order_unique_idx"
  ON "public"."UECourse" ("ueId", "order")
  WHERE "deletedAt" IS NULL;
