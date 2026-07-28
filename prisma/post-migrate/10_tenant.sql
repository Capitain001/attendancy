-- =============================================================================
-- 10_tenant.sql — Module tenant (Organization, User, RBAC, Document, AuditLog)
--
-- Seul objet manuel du module : les unicités de Permission.
-- Une permission est portée par un user OU une function (l'autre reste NULL),
-- et resource/resourceId NULL = permission large. Un @@unique Prisma serait
-- inopérant sur ces lignes (NULLs distincts en SQL standard) : deux
-- permissions globales identiques passeraient. NULLS NOT DISTINCT (PG15+)
-- ferme ce trou — non exprimable dans le schema Prisma, d'où sa place ici.
--
-- Impact applicatif : violation → P2002 avec meta.target = NOM D'INDEX
-- (string, pas un tableau de colonnes) — mappé dans CONSTRAINT_ERROR.
-- Document, AuditLog, Invitation : aucun objet SQL manuel (gardes applicatives).
-- =============================================================================

-- ─── Index / contraintes UNIQUE ──────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "permission_user_scope_unique_idx"
  ON "public"."Permission" ("userId", "action", "resource", "resourceId", "orgId")
  NULLS NOT DISTINCT;

CREATE UNIQUE INDEX IF NOT EXISTS "permission_function_scope_unique_idx"
  ON "public"."Permission" ("functionId", "action", "resource", "resourceId", "orgId")
  NULLS NOT DISTINCT;
