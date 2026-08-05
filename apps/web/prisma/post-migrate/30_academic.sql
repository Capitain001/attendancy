-- =============================================================================
-- 30_academic.sql — Module académique (Program/UE/UECourse · Class/Term/
--                   Course/StudentEnrollment/Group/StudentGroup)
--
-- Deux règles vivent en base :
--   · Unicité PARTIELLE de Course : un seul cours ACTIF par (classe, matière),
--     mais un cours soft-deleté libère la clé (recréation possible). Non
--     exprimable en @@unique Prisma → index partiel ici.
--   · Invariant StudentGroup : le groupe doit appartenir à la classe de
--     l'inscription. Non exprimable en FK (les deux chemins enrollment→class
--     et group→class doivent converger) → trigger.
--
-- L'archivage UE (deletedAt) n'a PAS de garde DB : le blocage d'attache d'une
-- UE archivée est applicatif (attachUEToProgram) — cas mineur, réversible,
-- UI ne proposant jamais d'UE archivée.
--
-- Impact applicatif de l'index partiel : violation → P2002 avec
-- meta.target = "course_active_unique_idx" (string) — mappé dans
-- CONSTRAINT_ERROR ; lookups par findFirst({ classId, ueCourseId,
-- deletedAt: null }), pas de findUnique composite.
-- =============================================================================

-- ─── Index / contraintes UNIQUE ──────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "course_active_unique_idx"
  ON "public"."Course" ("classId", "ueCourseId")
  WHERE "deletedAt" IS NULL;

-- ─── Fonctions ───────────────────────────────────────────────────────────────

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

-- ─── Triggers ────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS "validate_student_class_group" ON "public"."StudentGroup";
CREATE TRIGGER "validate_student_class_group"
BEFORE INSERT OR UPDATE ON "public"."StudentGroup"
FOR EACH ROW
EXECUTE FUNCTION "public"."validate_student_class_group"();
