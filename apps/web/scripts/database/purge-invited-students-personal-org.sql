-- Purge des étudiants invités dans l'organisation personnelle ciblée.
--
-- IMPORTANT :
-- 1. Vérifier les listes et les volumes retournés avant toute purge réelle.
-- 2. Le script refuse de continuer si les étudiants ont des présences ou des notes.
-- 3. Les comptes User globaux et les journaux AuditLog sont conservés.
-- 4. Les fichiers d'objets (storage) ne sont pas supprimés par ce SQL.
-- 5. La fin est volontairement ROLLBACK. Remplacer par COMMIT uniquement après
--    revue des résultats et sauvegarde adéquate.
-- Exécuter tout le fichier dans une seule session/transaction.

BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

CREATE TEMP TABLE _purge_params ON COMMIT DROP AS
SELECT 'a809f6c0-c593-475b-aca4-9ee143911145'::uuid AS org_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public."Organization" o
    JOIN pg_temp._purge_params p ON p.org_id = o.id
    WHERE o.type = 'PERSONAL'
  ) THEN
    RAISE EXCEPTION 'Organisation absente ou non PERSONAL; purge annulée.';
  END IF;
END;
$$;

-- Les étudiants visés doivent avoir un profil dans l'org ET une invitation
-- étudiant correspondante. Le rapprochement par email couvre les invitations
-- de nouveaux utilisateurs dont Invitation.userId est encore NULL.
CREATE TEMP TABLE _purge_students ON COMMIT DROP AS
SELECT DISTINCT s.id AS student_id, s."userId" AS user_id
FROM public."Student" s
JOIN public."User" u ON u.id = s."userId"
JOIN pg_temp._purge_params p ON p.org_id = s."orgId"
WHERE EXISTS (
  SELECT 1
  FROM public."Invitation" i
  WHERE i."orgId" = p.org_id
    AND COALESCE(i.role, i.details ->> 'role') = 'STUDENT'
    AND (
      i."userId" = s."userId"
      OR lower(i.email) = lower(u.email)
    )
);

CREATE TEMP TABLE _purge_invitations ON COMMIT DROP AS
SELECT i.id AS invitation_id
FROM public."Invitation" i
JOIN pg_temp._purge_params p ON p.org_id = i."orgId"
WHERE COALESCE(i.role, i.details ->> 'role') = 'STUDENT';

-- Aperçu des profils étudiants ciblés.
SELECT
  s.student_id,
  s.user_id,
  u.email,
  (
    SELECT count(*)
    FROM public."StudentEnrollment" e
    WHERE e."studentId" = s.student_id
  ) AS enrollment_count,
  (
    SELECT count(*)
    FROM public."Attendance" a
    WHERE a."studentId" = s.student_id
  ) AS attendance_count,
  (
    SELECT count(*)
    FROM public."Grade" g
    JOIN public."StudentEnrollment" e ON e.id = g."enrollmentId"
    WHERE e."studentId" = s.student_id
  ) AS grade_count
FROM pg_temp._purge_students s
JOIN public."User" u ON u.id = s.user_id
ORDER BY u.email;

-- Invitations étudiant de l'organisation (tous statuts).
SELECT i.id, i.email, i.status
FROM public."Invitation" i
JOIN pg_temp._purge_invitations p ON p.invitation_id = i.id
ORDER BY i.email, i."createdAt";

-- Notifications liées aux invitations ciblées (reçues et réponses).
SELECT n.id, n."userId", n.metadata ->> 'invitationId' AS invitation_id
FROM public."Notification" n
JOIN pg_temp._purge_invitations p
  ON p.invitation_id::text = n.metadata ->> 'invitationId'
WHERE n.type = 'INVITATION'
ORDER BY n."createdAt";

-- Documents polymorphes à traiter séparément avec le stockage objet.
SELECT d.id, d."resourceType", d."resourceId", d.path
FROM public."Document" d
JOIN pg_temp._purge_students s
  ON d."resourceType" = 'STUDENT' AND d."resourceId" = s.student_id
UNION ALL
SELECT d.id, d."resourceType", d."resourceId", d.path
FROM public."Document" d
JOIN public."Justification" j ON d."resourceId" = j.id
JOIN pg_temp._purge_students s ON s.student_id = j."studentId"
WHERE d."resourceType" = 'JUSTIFICATION';

-- Présences et notes rendent la suppression physique destructive pour
-- l'historique et/ou impossible selon les FK Restrict du schéma.
SELECT
  s.student_id,
  u.email,
  count(DISTINCT a.id) AS attendance_count,
  count(DISTINCT g.id) AS grade_count
FROM pg_temp._purge_students s
JOIN public."User" u ON u.id = s.user_id
LEFT JOIN public."StudentEnrollment" e ON e."studentId" = s.student_id
LEFT JOIN public."Attendance" a
  ON a."studentId" = s.student_id
  OR a."enrollmentId" = e.id
LEFT JOIN public."Grade" g ON g."enrollmentId" = e.id
GROUP BY s.student_id, u.email
HAVING count(DISTINCT a.id) > 0 OR count(DISTINCT g.id) > 0
ORDER BY u.email;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_temp._purge_students s
    JOIN public."StudentEnrollment" e ON e."studentId" = s.student_id
    WHERE EXISTS (
      SELECT 1 FROM public."Attendance" a
      WHERE a."enrollmentId" = e.id OR a."studentId" = s.student_id
    )
    OR EXISTS (
      SELECT 1 FROM public."Grade" g
      WHERE g."enrollmentId" = e.id
    )
  ) THEN
    RAISE EXCEPTION
      'Purge annulée : des étudiants ciblés ont des présences ou des notes. Examiner l''aperçu et décider séparément du sort de cet historique.';
  END IF;
END;
$$;

-- Nettoyage des données propres à l'invitation et au profil étudiant.
DELETE FROM public."Notification" n
USING pg_temp._purge_invitations p
WHERE n.type = 'INVITATION'
  AND n.metadata ->> 'invitationId' = p.invitation_id::text;

DELETE FROM public."Invitation" i
USING pg_temp._purge_invitations p
WHERE i.id = p.invitation_id;

DELETE FROM public."ParentRelation" r
USING pg_temp._purge_students s
WHERE r."studentId" = s.student_id;

DELETE FROM public."Justification" j
USING pg_temp._purge_students s
WHERE j."studentId" = s.student_id;

DELETE FROM public."OptionalUE" ou
USING pg_temp._purge_students s
WHERE ou."studentId" = s.student_id;

-- StudentGroup est supprimé par cascade avec StudentEnrollment.
DELETE FROM public."StudentEnrollment" e
USING pg_temp._purge_students s
WHERE e."studentId" = s.student_id;

DELETE FROM public."Student" st
USING pg_temp._purge_students s
WHERE st.id = s.student_id;

-- Retire les appartenances/rôles et autorisations de ces étudiants dans cette
-- organisation, sans supprimer leur compte global ni leurs autres adhésions.
DELETE FROM public."UserFunction" uf
USING public."Function" f, pg_temp._purge_students s, pg_temp._purge_params p
WHERE uf."functionId" = f.id
  AND f."orgId" = p.org_id
  AND uf."userId" = s.user_id;

DELETE FROM public."Permission" perm
USING pg_temp._purge_students s, pg_temp._purge_params p
WHERE perm."userId" = s.user_id
  AND perm."orgId" = p.org_id;

DELETE FROM public."UserOrganization" uo
USING pg_temp._purge_students s, pg_temp._purge_params p
WHERE uo."userId" = s.user_id
  AND uo."orgId" = p.org_id
  AND uo.role = 'STUDENT';

-- Contrôle final dans la transaction avant le ROLLBACK/COMMIT choisi.
SELECT
  (SELECT count(*) FROM pg_temp._purge_students) AS targeted_student_profiles,
  (
    SELECT count(*)
    FROM public."Invitation" i
    JOIN pg_temp._purge_params p ON p.org_id = i."orgId"
    WHERE COALESCE(i.role, i.details ->> 'role') = 'STUDENT'
  ) AS remaining_student_invitations,
  (
    SELECT count(*)
    FROM public."Student" st
    JOIN pg_temp._purge_students s ON s.student_id = st.id
  ) AS remaining_targeted_profiles;

-- Remplacer par COMMIT après validation explicite des aperçus et sauvegardes.
ROLLBACK;
