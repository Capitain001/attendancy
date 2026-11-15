-- ─── Note & Share : intégrité, index de purge, job de purge ──────────────────
-- Prérequis : extension pg_cron (00_extensions.sql) et tables "Note" / "Share"
-- (note.prisma).

-- Lien optionnel tout-ou-rien : resourceType et targetId sont soit tous deux
-- NULL (note libre), soit tous deux renseignés (note liée).
ALTER TABLE "public"."Note"
  DROP CONSTRAINT IF EXISTS "note_link_check";
ALTER TABLE "public"."Note"
  ADD CONSTRAINT "note_link_check"
  CHECK (("resourceType" IS NULL) = ("targetId" IS NULL));

-- Pas de targetId sans resourceType : un identifiant sans type de ressource est
-- ininterprétable (même pattern que Notification).
ALTER TABLE "public"."Share"
  DROP CONSTRAINT IF EXISTS "share_target_id_needs_resource_type";
ALTER TABLE "public"."Share"
  ADD CONSTRAINT "share_target_id_needs_resource_type"
  CHECK ("targetId" IS NULL OR "resourceType" IS NOT NULL);

-- Une seule ligne par audience et par note. NULLS NOT DISTINCT (PG15+) : sans
-- lui, les partages org-wide (resourceType/targetId NULL) pourraient se
-- dupliquer ; avec lui, les rôles d'une même audience se regroupent dans UNE
-- ligne (roles).
CREATE UNIQUE INDEX IF NOT EXISTS "share_note_audience_unique_idx"
  ON "public"."Share" ("noteId", "resourceType", "targetId")
  NULLS NOT DISTINCT;

-- Index partiel de la corbeille : ne contient que les notes supprimées
-- logiquement (une infime fraction de la table), donc minuscule. La purge
-- filtre sur deletedAt seul (rétention globale) : une seule colonne.
-- Non déclarable en Prisma (index partiel) : vit ici.
CREATE INDEX IF NOT EXISTS "note_trash_idx"
  ON "public"."Note" ("deletedAt")
  WHERE "deletedAt" IS NOT NULL;

-- Purge définitive des notes en corbeille au-delà de la rétention globale
-- (30 JOURS). La note appartient à l'utilisateur : aucune organisation ne
-- pilote cette durée. Les partages partent avec la note (cascade).
-- Retourne le nombre de notes supprimées.
-- SECURITY DEFINER + EXECUTE retiré aux rôles API : jamais appelable en RPC
-- depuis le client, uniquement par pg_cron.
CREATE OR REPLACE FUNCTION "public".purge_deleted_notes()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH purged AS (
    DELETE FROM "public"."Note"
    WHERE "deletedAt" IS NOT NULL
      AND "deletedAt" < timezone('utc', now()) - interval '30 days'
    RETURNING 1
  )
  SELECT count(*)::int FROM purged;
$$;

REVOKE ALL ON FUNCTION "public".purge_deleted_notes() FROM PUBLIC, anon, authenticated;

-- Exécution hebdomadaire chaque dimanche à 03:00 UTC.
-- Un nom de job existant met à jour sa planification sans créer de doublon.
SELECT cron.schedule(
  'purge-deleted-notes',
  '0 3 * * 0',
  $$SELECT "public".purge_deleted_notes()$$
);