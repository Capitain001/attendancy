-- =============================================================================
-- 100_stats.sql — Statistiques et agrégations temps réel (Teacher / Course)
--
-- Gère le calcul incrémental ($O(1)$) des volumes horaires effectués par les
-- enseignants lors du passage d'une séance au statut COMPLETED dans Schedule.
--
-- RÈGLES ET GARANTIES :
--  · Idempotent : Rejouable sans erreur via `prisma db execute`.
--  · Soft Delete (deletedAt) : Ignoré dans les agrégats. Si une séance
--    COMPLETED est archivée ou restaurée, le volume horaire est ajusté.
--  · Performance & Finesse :
--      - La clause WHEN et l'instruction OF filtrent les updates au niveau
--        Postgres (notes, salles, isLocked ne déclenchent AUCUN calcul).
--      - Mise à jour incrémentale via UPSERT atomique (aucun re-scan de table).
-- =============================================================================

-- ─── Fonctions ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "public"."fn_sync_teacher_course_stats"()
RETURNS TRIGGER AS $$ DECLARE   v_old_duration_hours DOUBLE PRECISION := 0;   v_new_duration_hours DOUBLE PRECISION := 0;   v_delta_hours DOUBLE PRECISION := 0; BEGIN    IF pg_trigger_depth() > 1 THEN     RETURN COALESCE(NEW, OLD);   END IF;    -- 1. CALCUL DU DELTA EN HEURES   -- Ancien volume si la ligne était COMPLETED et NON supprimée (soft delete)   IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN     IF OLD."status" = 'COMPLETED' AND OLD."deletedAt" IS NULL THEN       v_old_duration_hours := EXTRACT(EPOCH FROM (OLD."endTime" - OLD."startTime")) / 3600.0;     END IF;   END IF;    -- Nouveau volume si la ligne est COMPLETED et NON supprimée (soft delete)   IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN     IF NEW."status" = 'COMPLETED' AND NEW."deletedAt" IS NULL THEN       v_new_duration_hours := EXTRACT(EPOCH FROM (NEW."endTime" - NEW."startTime")) / 3600.0;     END IF;   END IF;    v_delta_hours := v_new_duration_hours - v_old_duration_hours;    -- Si aucun changement d'heures réelles sur ce cours, sortie immédiate   IF v_delta_hours = 0 AND (TG_OP = 'UPDATE' AND OLD."teacherId" = NEW."teacherId" AND OLD."courseId" = NEW."courseId") THEN     RETURN COALESCE(NEW, OLD);   END IF;    -- 2. CHANGEMENT D'ENSEIGNANT OU DE COURS (Déréférencement de l'ancien)   IF TG_OP = 'UPDATE' AND OLD."status" = 'COMPLETED' AND OLD."deletedAt" IS NULL THEN     IF (OLD."teacherId" IS DISTINCT FROM NEW."teacherId" OR OLD."courseId" IS DISTINCT FROM NEW."courseId") THEN       UPDATE "public"."TeacherCourseStats"       SET          "completedHours" = GREATEST(0, "completedHours" - v_old_duration_hours),         "updatedAt" = CURRENT_TIMESTAMP       WHERE "teacherId" = OLD."teacherId"         AND "courseId" = OLD."courseId";                v_delta_hours := v_new_duration_hours;     END IF;   END IF;    -- 3. UPSERT ATOMIQUE DE LA STATISTIQUE ENSEIGNANT   IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW."status" = 'COMPLETED' AND NEW."deletedAt" IS NULL THEN     INSERT INTO "public"."TeacherCourseStats" (       "id",       "orgId",       "teacherId",       "courseId",       "completedHours",       "createdAt",       "updatedAt"     )     VALUES (       gen_random_uuid()::text,       NEW."orgId",       NEW."teacherId",       NEW."courseId",       GREATEST(0, v_delta_hours),       CURRENT_TIMESTAMP,       CURRENT_TIMESTAMP     )     ON CONFLICT ("teacherId", "courseId")      DO UPDATE SET       "completedHours" = GREATEST(0, "public"."TeacherCourseStats"."completedHours" + EXCLUDED."completedHours"),       "updatedAt" = CURRENT_TIMESTAMP;    ELSIF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND (NEW."status" <> 'COMPLETED' OR NEW."deletedAt" IS NOT NULL))) THEN     IF OLD."teacherId" IS NOT NULL AND OLD."courseId" IS NOT NULL THEN       UPDATE "public"."TeacherCourseStats"       SET          "completedHours" = GREATEST(0, "completedHours" - v_old_duration_hours),         "updatedAt" = CURRENT_TIMESTAMP       WHERE "teacherId" = OLD."teacherId"         AND "courseId" = OLD."courseId";     END IF;   END IF;    RETURN COALESCE(NEW, OLD); END; $$ LANGUAGE plpgsql;

-- ─── Triggers ────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS "trg_sync_teacher_course_stats" ON "public"."Schedule";

CREATE TRIGGER "trg_sync_teacher_course_stats"
AFTER INSERT OR DELETE OR UPDATE OF "status", "startTime", "endTime", "teacherId", "courseId", "deletedAt"
ON "public"."Schedule"
FOR EACH ROW
WHEN (
  (NEW."status" = 'COMPLETED' OR OLD."status" = 'COMPLETED')
)
EXECUTE FUNCTION "public"."fn_sync_teacher_course_stats"();