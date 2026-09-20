-- =============================================================================
-- 40_schedule.sql — Module planning (Schedule, Location)
--
-- Cœur anti-conflit du produit, garanti EN BASE :
--   · during (tstzrange dérivé de startTime/endTime par trigger) + contraintes
--     d'exclusion GiST = zéro double-réservation salle/prof/classe/groupe,
--     même en écriture concurrente. CANCELED/MISSED et soft-deleted ne
--     réservent plus la ressource (prédicats WHERE).
--   · Verrou métier : un Schedule non-PENDING est figé sur ses champs
--     structurants (trigger, déclenché uniquement sur ces colonnes).
--   · Location.position (geography dérivée de lat/lng par trigger) porte le
--     géofencing consommé par 50_attendance (teacher_check_in).
--   · TeacherCourseHours (compteur d'heures réalisées par enseignant/cours/
--     type de séance) est maintenu par trigger sur Schedule — voir section
--     dédiée en fin de fichier.
--
-- Sémantique groupId : NULL = séance de la CLASSE ENTIÈRE — c'est le prédicat
-- qui sépare no_class_overlap_global de no_group_overlap.
-- Dépendances : 00_extensions (btree_gist, postgis).
-- =============================================================================

-- ─── Colonnes dérivées ───────────────────────────────────────────────────────

ALTER TABLE "public"."Schedule"
  ADD COLUMN IF NOT EXISTS "during" tstzrange;

ALTER TABLE "public"."Location"
  ADD COLUMN IF NOT EXISTS position geography(Point, 4326);

-- ─── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS schedule_during_gist_idx
  ON "public"."Schedule" USING GIST (during);

CREATE INDEX IF NOT EXISTS location_position_idx
  ON "public"."Location" USING GIST (position);

-- ─── Contraintes CHECK ───────────────────────────────────────────────────────

-- Intégrité (pas une règle métier) : un intervalle inversé rendrait le
-- tstzrange invalide et casserait mécaniquement les contraintes d'exclusion.
ALTER TABLE "public"."Schedule"
  DROP CONSTRAINT IF EXISTS "check_schedule_time_order";
ALTER TABLE "public"."Schedule"
  ADD CONSTRAINT "check_schedule_time_order"
  CHECK ("startTime" < "endTime");

-- ─── Contraintes d'exclusion ─────────────────────────────────────────────────

ALTER TABLE "public"."Schedule" DROP CONSTRAINT IF EXISTS no_room_overlap;
ALTER TABLE "public"."Schedule" ADD CONSTRAINT no_room_overlap
EXCLUDE USING gist ("orgId" WITH =, "roomId" WITH =, during WITH &&)
WHERE (status NOT IN ('CANCELED', 'MISSED') AND "deletedAt" IS NULL);

ALTER TABLE "public"."Schedule" DROP CONSTRAINT IF EXISTS no_teacher_overlap;
ALTER TABLE "public"."Schedule" ADD CONSTRAINT no_teacher_overlap
EXCLUDE USING gist ("orgId" WITH =, "teacherId" WITH =, during WITH &&)
WHERE (status NOT IN ('CANCELED', 'MISSED') AND "deletedAt" IS NULL);

ALTER TABLE "public"."Schedule" DROP CONSTRAINT IF EXISTS no_class_overlap_global;
ALTER TABLE "public"."Schedule" ADD CONSTRAINT no_class_overlap_global
EXCLUDE USING gist ("orgId" WITH =, "classId" WITH =, during WITH &&)
WHERE (status NOT IN ('CANCELED', 'MISSED') AND "deletedAt" IS NULL AND "groupId" IS NULL);

ALTER TABLE "public"."Schedule" DROP CONSTRAINT IF EXISTS no_group_overlap;
ALTER TABLE "public"."Schedule" ADD CONSTRAINT no_group_overlap
EXCLUDE USING gist ("orgId" WITH =, "groupId" WITH =, during WITH &&)
WHERE (status NOT IN ('CANCELED', 'MISSED') AND "deletedAt" IS NULL AND "groupId" IS NOT NULL);

-- ─── Fonctions ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_schedule_during()
RETURNS TRIGGER AS $$
BEGIN
  NEW.during := tstzrange(NEW."startTime", NEW."endTime", '[)');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_location_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.position := ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Verrou : seuls les PENDING sont modifiables (COMPLETED/CANCELED/MISSED figés).
-- isLocked: une séance verrouillée => figée, même si le status est PENDING.
CREATE OR REPLACE FUNCTION prevent_locked_schedule_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Impossible de modifier un schedule avec le status %', OLD.status;
  END IF;

  IF OLD."isLocked" THEN
    RAISE EXCEPTION 'Séance verrouillée : modification impossible';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Triggers ────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trigger_sync_schedule_during ON "public"."Schedule";
CREATE TRIGGER trigger_sync_schedule_during
BEFORE INSERT OR UPDATE OF "startTime", "endTime"
ON "public"."Schedule"
FOR EACH ROW EXECUTE FUNCTION sync_schedule_during();

DROP TRIGGER IF EXISTS trg_sync_location_position ON "public"."Location";
CREATE TRIGGER trg_sync_location_position
BEFORE INSERT OR UPDATE OF latitude, longitude
ON "public"."Location"
FOR EACH ROW EXECUTE FUNCTION sync_location_position();

-- Déclenché UNIQUEMENT sur les champs structurants : les updates de statut,
-- notes ou notification restent libres. scheduleType est inclus depuis
-- l'introduction de TeacherCourseHours (voir section ci-dessous) : une
-- séance COMPLETED ne doit plus jamais changer de type de séance, pour que
-- le compteur d'heures reste toujours cohérent avec sa clé.
DROP TRIGGER IF EXISTS trigger_prevent_locked_schedule_update ON "public"."Schedule";
CREATE TRIGGER trigger_prevent_locked_schedule_update
BEFORE UPDATE OF "courseId", "teacherId", "roomId", "classId", "groupId",
                  "startTime", "endTime", "scheduleType"
ON "public"."Schedule"
FOR EACH ROW EXECUTE FUNCTION prevent_locked_schedule_update();

-- =============================================================================
-- TeacherCourseHours — heures réalisées par enseignant, par cours, par type
-- de séance (scheduleType). Compteur INCRÉMENTAL maintenu par trigger (pas de
-- MATERIALIZED VIEW : un refresh recalculerait tout, un trigger UPSERT est
-- O(1) par écriture).
--
-- Sûreté du compteur : grâce au verrou scheduleType posé juste au-dessus, un
-- Schedule COMPLETED ne peut plus changer de type de séance — donc jamais de
-- transfert de clé à gérer ici (retrait d'un compteur + ajout dans un autre).
--
-- Formule et règle d'inclusion documentées en miroir dans
-- src/services/teacher-course-hours/policy.ts.
-- =============================================================================

-- ─── Fonctions ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "public"."sync_teacher_course_hours_stats"()
RETURNS TRIGGER AS $$
DECLARE
  v_duration DOUBLE PRECISION;
BEGIN

  -- ── Retrait : la séance SORT de l'état compté (COMPLETED + non supprimée) ──
  IF (TG_OP = 'DELETE'
      OR (TG_OP = 'UPDATE' AND (NEW."status" <> 'COMPLETED' OR NEW."deletedAt" IS NOT NULL)))
     AND OLD."status" = 'COMPLETED' AND OLD."deletedAt" IS NULL THEN

    v_duration := EXTRACT(EPOCH FROM (OLD."endTime" - OLD."startTime")) / 3600.0;

    UPDATE "public"."TeacherCourseHours"
    SET "completedHours" = GREATEST(0, "completedHours" - v_duration),
        "updatedAt"      = CURRENT_TIMESTAMP
    WHERE "teacherId"     = OLD."teacherId"
      AND "courseId"      = OLD."courseId"
      AND "scheduleType"  = OLD."scheduleType";

  END IF;

  -- ── Ajout : la séance ENTRE dans l'état compté ──────────────────────────────
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE')
     AND NEW."status" = 'COMPLETED' AND NEW."deletedAt" IS NULL
     AND (TG_OP = 'INSERT'
          OR OLD."status" IS DISTINCT FROM 'COMPLETED'
          OR OLD."deletedAt" IS NOT NULL) THEN

    v_duration := EXTRACT(EPOCH FROM (NEW."endTime" - NEW."startTime")) / 3600.0;

    INSERT INTO "public"."TeacherCourseHours"
      ("id", "orgId", "teacherId", "courseId", "scheduleType", "completedHours", "updatedAt")
    VALUES
      (gen_random_uuid(), NEW."orgId", NEW."teacherId", NEW."courseId", NEW."scheduleType",
       v_duration, CURRENT_TIMESTAMP)
    ON CONFLICT ("teacherId", "courseId", "scheduleType")
    DO UPDATE SET
      "completedHours" = "public"."TeacherCourseHours"."completedHours" + EXCLUDED."completedHours",
      "updatedAt"      = CURRENT_TIMESTAMP;

  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- Se déclenche uniquement sur INSERT/DELETE et sur les colonnes qui peuvent
-- faire entrer/sortir une séance de l'état compté (status, deletedAt).
DROP TRIGGER IF EXISTS trg_sync_teacher_course_hours ON "public"."Schedule";
CREATE TRIGGER trg_sync_teacher_course_hours
AFTER INSERT OR DELETE OR UPDATE OF "status", "deletedAt"
ON "public"."Schedule"
FOR EACH ROW EXECUTE FUNCTION "public"."sync_teacher_course_hours_stats"();