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
CREATE OR REPLACE FUNCTION prevent_locked_schedule_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Impossible de modifier un schedule avec le status %', OLD.status;
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
-- notes ou notification restent libres.
DROP TRIGGER IF EXISTS trigger_prevent_locked_schedule_update ON "public"."Schedule";
CREATE TRIGGER trigger_prevent_locked_schedule_update
BEFORE UPDATE OF "courseId", "teacherId", "roomId", "classId", "groupId", "startTime", "endTime"
ON "public"."Schedule"
FOR EACH ROW EXECUTE FUNCTION prevent_locked_schedule_update();
