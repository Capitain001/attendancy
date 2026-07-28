-- =============================================================================
-- 20_profile.sql — Module profils (Teacher, Student, Parent, Direction,
--                  ParentRelation)
--
-- AUCUN objet SQL manuel — et c'est un choix, pas un oubli :
--   · Unicité des profils : @@unique([userId, orgId]) natif Prisma. La
--     réintégration d'un profil soft-deleté passe par le pattern RESTORE
--     (réveil de la ligne, deletedAt: null) côté service — jamais par un
--     index partiel : l'historique (cours, présences) doit rester rattaché
--     au même id.
--   · ParentRelation : sans soft delete, @@unique([parentId, studentId])
--     natif suffit ; le délien est un hard delete tracé par AuditLog.
--
-- Fichier conservé comme point d'ancrage : tout futur objet SQL du domaine
-- profils vit ici.
-- =============================================================================

SELECT 1; -- no-op : module volontairement vide
