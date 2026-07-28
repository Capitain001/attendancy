-- =============================================================================
-- 60_evaluation.sql — Module évaluation (Evaluation)
--
-- AUCUN objet SQL manuel — choix assumés :
--   · Evaluation = fait immuable sans soft delete ; correction par UPDATE
--     tracé AuditLog. Aucune contrainte de plage sur score (une note hors
--     barème est une erreur de saisie, pas une corruption — validation
--     applicative Valibot).
--   · La clôture de période (Term.lockedAt) est une garde APPLICATIVE dans
--     le service d'évaluation, pas un trigger : cas de faible gravité,
--     réversible, un seul point d'écriture.
--
-- Point d'ancrage pour de futurs objets du domaine notes/bulletins.
-- =============================================================================

SELECT 1; -- no-op : module volontairement vide
