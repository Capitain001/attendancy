-- Migration manuelle : synchronise l'historique Prisma avec les index
-- déjà créés en base via les scripts post-migrate (colonnes Unsupported).
-- Ces index existent déjà en production, ils ne doivent PAS être recréés.

-- Location.position (geography) — index GiST créé par post-migrate/50_attendance.sql
CREATE INDEX IF NOT EXISTS "location_position_idx" ON "public"."Location" USING GIST ("position");

-- Session.position (geography) — index GiST créé par post-migrate/50_attendance.sql
CREATE INDEX IF NOT EXISTS "session_position_idx" ON "public"."Session" USING GIST ("position");

-- Schedule.during (tstzrange) — index GiST créé par post-migrate/40_schedule.sql
CREATE INDEX IF NOT EXISTS "schedule_during_gist_idx" ON "public"."Schedule" USING GIST ("during");

-- Permission — index UNIQUE NULLS NOT DISTINCT créés par post-migrate
CREATE UNIQUE INDEX IF NOT EXISTS "permission_function_scope_unique_idx"
  ON "public"."Permission" ("functionId", "action", "resource", "resourceId", "orgId")
  NULLS NOT DISTINCT;

CREATE UNIQUE INDEX IF NOT EXISTS "permission_user_scope_unique_idx"
  ON "public"."Permission" ("userId", "action", "resource", "resourceId", "orgId")
  NULLS NOT DISTINCT;