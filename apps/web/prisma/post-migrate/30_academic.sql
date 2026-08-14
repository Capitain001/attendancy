-- =============================================================================
-- 30_academic.sql — Module académique (Program/UE/UECourse · Class/Term/
--                   Course/StudentEnrollment/Group/StudentGroup)
--
-- Trois règles vivent en base :
--   · Unicité PARTIELLE de Course : un seul cours ACTIF par (classe, matière),
--     mais un cours soft-deleté libère la clé (recréation possible). Non
--     exprimable en @@unique Prisma → index partiel ici.
--   · Unicité PARTIELLE de UECourse : même logique que Course — un nom et une
--     position (order) ne sont uniques QUE parmi les cours actifs d'une UE ;
--     l'archivage libère name/order pour réutilisation. Non exprimable en
--     @@unique Prisma → index partiel ici.
--   · Ordre auto-géré de UECourse (order) : garantit — en l'absence de reorder
--     explicite côté app — une séquence dense et sans trou parmi les cours
--     actifs d'une UE, à l'insertion, à la suppression réelle, à l'archivage
--     (soft delete) et à la restauration. Non exprimable en contrainte
--     déclarative → triggers.
--   · Invariant StudentGroup : le groupe doit appartenir à la classe de
--     l'inscription. Non exprimable en FK (les deux chemins enrollment→class
--     et group→class doivent converger) → trigger.
--
-- L'archivage UE (deletedAt) n'a PAS de garde DB : le blocage d'attache d'une
-- UE archivée est applicatif (attachUEToProgram) — cas mineur, réversible,
-- UI ne proposant jamais d'UE archivée.
--
-- Impact applicatif de l'index partiel Course : violation → P2002 avec
-- meta.target = "course_active_unique_idx" (string) — mappé dans
-- CONSTRAINT_ERROR ; lookups par findFirst({ classId, ueCourseId,
-- deletedAt: null }), pas de findUnique composite.
--
-- Impact applicatif des index partiels UECourse : même mécanique — violation
-- → P2002 avec meta.target = "uecourse_active_name_unique_idx" ou
-- "uecourse_active_order_unique_idx" ; lookups par findFirst({ ueId, ...,
-- deletedAt: null }), pas de findUnique composite sur (name, ueId) ni
-- (ueId, order).
-- =============================================================================

-- ─── Index / contraintes UNIQUE ──────────────────────────────────────────────

-- MODEL: Course
CREATE UNIQUE INDEX IF NOT EXISTS "course_active_unique_idx"
  ON "public"."Course" ("classId", "ueCourseId")
  WHERE "deletedAt" IS NULL;

-- MODEL: UECourse (name, order — uniques parmi les cours actifs uniquement)
CREATE UNIQUE INDEX IF NOT EXISTS "uecourse_active_name_unique_idx"
  ON "public"."UECourse" ("name", "ueId")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "uecourse_active_order_unique_idx"
  ON "public"."UECourse" ("ueId", "order")
  WHERE "deletedAt" IS NULL;

-- ─── Fonctions ───────────────────────────────────────────────────────────────

-- MODEL: StudentGroup
CREATE OR REPLACE FUNCTION "public"."validate_student_class_group"()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT e."classId"
    FROM "public"."StudentEnrollment" e
    WHERE e.id = NEW."enrollmentId"
  ) != (
    SELECT g."classId"
    FROM "public"."Group" g
    WHERE g.id = NEW."groupId"
  ) THEN
    RAISE EXCEPTION 'Le groupe doit appartenir a la meme classe que l''enrollment';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- MODEL: UECourse — INSERT
-- order NULL  → place en dernière position (fallback, parmi les actifs)
-- order fourni et libre (parmi les actifs) → insertion directe
-- order fourni et occupé (par un actif) → décale les suivants actifs
CREATE OR REPLACE FUNCTION "public"."fn_uecourse_insert_order"()
RETURNS TRIGGER AS $$
BEGIN

  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- fallback fin de liste (parmi les cours actifs)
  IF NEW."order" IS NULL THEN
    SELECT COALESCE(MAX("order"), 0) + 1
    INTO NEW."order"
    FROM "public"."UECourse"
    WHERE "ueId" = NEW."ueId"
      AND "deletedAt" IS NULL;

    RETURN NEW;
  END IF;

  -- si position occupée par un cours ACTIF → décaler
  IF EXISTS (
    SELECT 1
    FROM "public"."UECourse"
    WHERE "ueId" = NEW."ueId"
      AND "order" = NEW."order"
      AND "deletedAt" IS NULL
  ) THEN

    -- déplacement temporaire
    UPDATE "public"."UECourse"
    SET "order" = "order" + 1000
    WHERE "ueId" = NEW."ueId"
      AND "order" >= NEW."order"
      AND "deletedAt" IS NULL;

    -- repositionnement final
    UPDATE "public"."UECourse"
    SET "order" = "order" - 999
    WHERE "ueId" = NEW."ueId"
      AND "order" >= NEW."order" + 1000
      AND "deletedAt" IS NULL;

  END IF;

  RETURN NEW;

END;
$$ LANGUAGE plpgsql;

-- MODEL: UECourse — DELETE (hard delete réel)
-- Comble les trous parmi les cours actifs restants après suppression physique.
CREATE OR REPLACE FUNCTION "public"."fn_uecourse_delete_order"()
RETURNS TRIGGER AS $$
BEGIN

  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  UPDATE "public"."UECourse"
  SET "order" = "order" - 1
  WHERE "ueId" = OLD."ueId"
    AND "order" > OLD."order"
    AND "deletedAt" IS NULL;

  RETURN OLD;

END;
$$ LANGUAGE plpgsql;

-- MODEL: UECourse — ARCHIVAGE (soft delete, transition actif → archivé)
-- Comble le trou laissé chez les cours actifs restants, comme un vrai DELETE.
-- La ligne archivée conserve son ancien "order" pour l'audit — l'index
-- partiel (uecourse_active_order_unique_idx) garantit qu'il n'entre plus en
-- conflit avec un cours actif.
CREATE OR REPLACE FUNCTION "public"."fn_uecourse_archive_order"()
RETURNS TRIGGER AS $$
BEGIN

  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF OLD."order" IS NOT NULL THEN
    UPDATE "public"."UECourse"
    SET "order" = "order" - 1
    WHERE "ueId" = OLD."ueId"
      AND "order" > OLD."order"
      AND "deletedAt" IS NULL;
  END IF;

  RETURN NEW;

END;
$$ LANGUAGE plpgsql;

-- MODEL: UECourse — RESTAURATION (transition archivé → actif)
-- L'ancien "order" du cours restauré peut être obsolète ou déjà occupé par un
-- cours actif inséré entre-temps : on le replace systématiquement en fin de
-- liste, comme un insert. Un reorder manuel côté app reste possible ensuite.
CREATE OR REPLACE FUNCTION "public"."fn_uecourse_restore_order"()
RETURNS TRIGGER AS $$
BEGIN

  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX("order"), 0) + 1
  INTO NEW."order"
  FROM "public"."UECourse"
  WHERE "ueId" = NEW."ueId"
    AND "deletedAt" IS NULL;

  RETURN NEW;

END;
$$ LANGUAGE plpgsql;

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- MODEL: StudentGroup
DROP TRIGGER IF EXISTS "validate_student_class_group" ON "public"."StudentGroup";
CREATE TRIGGER "validate_student_class_group"
BEFORE INSERT OR UPDATE ON "public"."StudentGroup"
FOR EACH ROW
EXECUTE FUNCTION "public"."validate_student_class_group"();

-- MODEL: UECourse — ordre auto-géré (insert / delete / archive / restore)
DROP TRIGGER IF EXISTS "trg_uecourse_insert_order" ON "public"."UECourse";
CREATE TRIGGER "trg_uecourse_insert_order"
BEFORE INSERT ON "public"."UECourse"
FOR EACH ROW
EXECUTE FUNCTION "public"."fn_uecourse_insert_order"();

DROP TRIGGER IF EXISTS "trg_uecourse_delete_order" ON "public"."UECourse";
CREATE TRIGGER "trg_uecourse_delete_order"
AFTER DELETE ON "public"."UECourse"
FOR EACH ROW
EXECUTE FUNCTION "public"."fn_uecourse_delete_order"();

DROP TRIGGER IF EXISTS "trg_uecourse_archive_order" ON "public"."UECourse";
CREATE TRIGGER "trg_uecourse_archive_order"
AFTER UPDATE OF "deletedAt" ON "public"."UECourse"
FOR EACH ROW
WHEN (OLD."deletedAt" IS NULL AND NEW."deletedAt" IS NOT NULL)
EXECUTE FUNCTION "public"."fn_uecourse_archive_order"();

DROP TRIGGER IF EXISTS "trg_uecourse_restore_order" ON "public"."UECourse";
CREATE TRIGGER "trg_uecourse_restore_order"
BEFORE UPDATE OF "deletedAt" ON "public"."UECourse"
FOR EACH ROW
WHEN (OLD."deletedAt" IS NOT NULL AND NEW."deletedAt" IS NULL)
EXECUTE FUNCTION "public"."fn_uecourse_restore_order"();