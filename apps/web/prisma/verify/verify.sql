-- =============================================================================
-- verify.sql — Diagnostic des objets post-migrate (LECTURE SEULE)
--
-- À exécuter après la chaîne post-migrate (et après toute migration Prisma)
-- pour vérifier qu'aucun objet manuel n'a été détruit par un DROP généré.
-- Chaque section liste les objets ATTENDUS ; un manquant = re-exécuter les
-- scripts post-migrate et inspecter la dernière migration Prisma.
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

SELECT extname AS extension_ok
FROM pg_extension
WHERE extname IN ('btree_gist', 'postgis')
ORDER BY extname;
-- Attendu : 2 lignes

-- ─── Colonnes dérivées ───────────────────────────────────────────────────────

SELECT table_name, column_name AS derived_column_ok
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('Schedule', 'during'),
    ('Location', 'position'),
    ('Session',  'position')
  )
ORDER BY table_name;
-- Attendu : 3 lignes

-- ─── Index manuels ───────────────────────────────────────────────────────────

SELECT indexname AS index_ok
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    -- 10_tenant
    'permission_user_scope_unique_idx',
    'permission_function_scope_unique_idx',
    -- 30_academic
    'course_active_unique_idx',
    -- 40_schedule
    'schedule_during_gist_idx',
    'location_position_idx',
    -- 50_attendance
    'session_position_idx'
  )
ORDER BY indexname;
-- Attendu : 6 lignes

-- ─── Contraintes (CHECK + EXCLUDE) ───────────────────────────────────────────

SELECT conname AS constraint_ok, contype
FROM pg_constraint
WHERE conname IN (
    -- 40_schedule
    'check_schedule_time_order',
    'no_room_overlap',
    'no_teacher_overlap',
    'no_class_overlap_global',
    'no_group_overlap'
)
ORDER BY conname;
-- Attendu : 5 lignes (1 check "c" + 4 exclusion "x")

-- ─── Fonctions ───────────────────────────────────────────────────────────────

SELECT routine_name AS function_ok
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    -- 30_academic
    'validate_student_class_group',
    -- 40_schedule
    'sync_schedule_during',
    'sync_location_position',
    'prevent_locked_schedule_update',
    -- 50_attendance
    'verify_point_in_radius',
    'teacher_check_in',
    'create_session_token',
    'validate_session_token',
    -- 70_communication
    'chat_get_org_channel_id',
    'chat_get_class_channel_id',
    'chat_get_group_channel_id',
    'trg_chat_on_user_organization_ins',
    'trg_chat_on_class_ins',
    'trg_chat_on_group_ins',
    'trg_chat_on_student_enrollment_ins',
    'trg_chat_on_student_group_ins'
  )
GROUP BY routine_name
ORDER BY routine_name;
-- Attendu : 16 lignes

-- ─── Triggers ────────────────────────────────────────────────────────────────

SELECT trigger_name AS trigger_ok
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    -- 30_academic
    'validate_student_class_group',
    -- 40_schedule
    'trigger_sync_schedule_during',
    'trg_sync_location_position',
    'trigger_prevent_locked_schedule_update',
    -- 70_communication
    'trg_chat_on_user_organization_ins',
    'trg_chat_on_class_ins',
    'trg_chat_on_group_ins',
    'trg_chat_on_student_enrollment_ins',
    'trg_chat_on_student_group_ins'
  )
GROUP BY trigger_name
ORDER BY trigger_name;
-- Attendu : 9 lignes

-- ─── Vues ────────────────────────────────────────────────────────────────────

SELECT table_name AS view_ok
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'session_presence_map';
-- Attendu : 1 ligne

-- ─── Storage (buckets + policies) ────────────────────────────────────────────

SELECT id AS bucket_ok, public
FROM storage.buckets
WHERE id IN (
    -- storage/avatar.sql
    'avatars',
    'logos'  -- storage/logo.sql
  )
ORDER BY id;
-- Attendu : 1 ligne

SELECT policyname AS storage_policy_ok, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN (
    'avatars_public_read', 'avatars_owner_insert', 'avatars_owner_update', 'avatars_owner_delete',
    'logos_public_read', 'logos_responsable_insert', 'logos_responsable_update', 'logos_responsable_delete'  -- storage/logo.sql
  )

ORDER BY policyname;
-- Attendu : 8 lignes

-- ─── Bonus : doublons d'index physiques (dérive migrations) ──────────────────

SELECT tablename, array_agg(indexname) AS duplicated_indexes
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename, regexp_replace(indexdef, '^CREATE (UNIQUE )?INDEX \S+ ', '')
HAVING COUNT(*) > 1;
-- Attendu : 0 ligne