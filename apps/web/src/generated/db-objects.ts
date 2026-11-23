// ⚠️ Fichier généré par scripts/generate/db/objects.ts — ne pas modifier à la main.
// Source : prisma/post-migrate/**/*.sql
/* eslint-disable */

export const DATABASE_OBJECTS = {
  "EXTENSIONS": {
    "BTREE_GIST": "btree_gist",
    "PG_CRON": "pg_cron",
    "POSTGIS": "postgis"
  },
  "INDEXES": {
    "COURSE_ACTIVE_UNIQUE_IDX": "course_active_unique_idx",
    "JUSTIFICATION_PENDING_UNIQUE_IDX": "justification_pending_unique_idx",
    "LOCATION_POSITION_IDX": "location_position_idx",
    "NOTE_TRASH_IDX": "note_trash_idx",
    "NOTIFICATION_UNREAD_IDX": "notification_unread_idx",
    "PERMISSION_FUNCTION_SCOPE_UNIQUE_IDX": "permission_function_scope_unique_idx",
    "PERMISSION_USER_SCOPE_UNIQUE_IDX": "permission_user_scope_unique_idx",
    "SCHEDULE_DURING_GIST_IDX": "schedule_during_gist_idx",
    "SESSION_POSITION_IDX": "session_position_idx",
    "SHARE_NOTE_AUDIENCE_UNIQUE_IDX": "share_note_audience_unique_idx",
    "UECOURSE_ACTIVE_NAME_UNIQUE_IDX": "uecourse_active_name_unique_idx",
    "UECOURSE_ACTIVE_ORDER_UNIQUE_IDX": "uecourse_active_order_unique_idx"
  },
  "UNIQUE_INDEXES": {
    "COURSE_ACTIVE_UNIQUE_IDX": "course_active_unique_idx",
    "JUSTIFICATION_PENDING_UNIQUE_IDX": "justification_pending_unique_idx",
    "PERMISSION_FUNCTION_SCOPE_UNIQUE_IDX": "permission_function_scope_unique_idx",
    "PERMISSION_USER_SCOPE_UNIQUE_IDX": "permission_user_scope_unique_idx",
    "SHARE_NOTE_AUDIENCE_UNIQUE_IDX": "share_note_audience_unique_idx",
    "UECOURSE_ACTIVE_NAME_UNIQUE_IDX": "uecourse_active_name_unique_idx",
    "UECOURSE_ACTIVE_ORDER_UNIQUE_IDX": "uecourse_active_order_unique_idx"
  },
  "CONSTRAINTS": {
    "CHECK_SCHEDULE_TIME_ORDER": "check_schedule_time_order",
    "INVITATION_RESOLVED_CONSISTENCY": "invitation_resolved_consistency",
    "NO_CLASS_OVERLAP_GLOBAL": "no_class_overlap_global",
    "NO_GROUP_OVERLAP": "no_group_overlap",
    "NO_ROOM_OVERLAP": "no_room_overlap",
    "NO_TEACHER_OVERLAP": "no_teacher_overlap",
    "NOTE_LINK_CHECK": "note_link_check",
    "NOTIFICATION_RESOURCE_ID_NEEDS_TYPE": "notification_resource_id_needs_type",
    "PERMISSION_RESOURCE_ID_REQUIRES_RESOURCE": "permission_resource_id_requires_resource",
    "SHARE_TARGET_ID_NEEDS_RESOURCE_TYPE": "share_target_id_needs_resource_type"
  },
  "FUNCTIONS": {
    "CHAT_GET_CLASS_CHANNEL_ID": "chat_get_class_channel_id",
    "CHAT_GET_GROUP_CHANNEL_ID": "chat_get_group_channel_id",
    "CHAT_GET_ORG_CHANNEL_ID": "chat_get_org_channel_id",
    "CREATE_SESSION_TOKEN": "create_session_token",
    "FN_SYNC_TEACHER_COURSE_STATS": "fn_sync_teacher_course_stats",
    "FN_UECOURSE_ARCHIVE_ORDER": "fn_uecourse_archive_order",
    "FN_UECOURSE_DELETE_ORDER": "fn_uecourse_delete_order",
    "FN_UECOURSE_INSERT_ORDER": "fn_uecourse_insert_order",
    "FN_UECOURSE_RESTORE_ORDER": "fn_uecourse_restore_order",
    "PREVENT_LOCKED_SCHEDULE_UPDATE": "prevent_locked_schedule_update",
    "PURGE_DELETED_NOTES": "purge_deleted_notes",
    "SYNC_LOCATION_POSITION": "sync_location_position",
    "SYNC_SCHEDULE_DURING": "sync_schedule_during",
    "SYNC_TEACHER_COURSE_HOURS_STATS": "sync_teacher_course_hours_stats",
    "TEACHER_CHECK_IN": "teacher_check_in",
    "TRG_CHAT_ON_CLASS_INS": "trg_chat_on_class_ins",
    "TRG_CHAT_ON_GROUP_INS": "trg_chat_on_group_ins",
    "TRG_CHAT_ON_STUDENT_ENROLLMENT_INS": "trg_chat_on_student_enrollment_ins",
    "TRG_CHAT_ON_STUDENT_GROUP_INS": "trg_chat_on_student_group_ins",
    "TRG_CHAT_ON_USER_ORGANIZATION_INS": "trg_chat_on_user_organization_ins",
    "VALIDATE_SESSION_TOKEN": "validate_session_token",
    "VALIDATE_STUDENT_CLASS_GROUP": "validate_student_class_group",
    "VERIFY_POINT_IN_RADIUS": "verify_point_in_radius"
  },
  "TRIGGERS": {
    "TRG_CHAT_ON_CLASS_INS": "trg_chat_on_class_ins",
    "TRG_CHAT_ON_GROUP_INS": "trg_chat_on_group_ins",
    "TRG_CHAT_ON_STUDENT_ENROLLMENT_INS": "trg_chat_on_student_enrollment_ins",
    "TRG_CHAT_ON_STUDENT_GROUP_INS": "trg_chat_on_student_group_ins",
    "TRG_CHAT_ON_USER_ORGANIZATION_INS": "trg_chat_on_user_organization_ins",
    "TRG_SYNC_LOCATION_POSITION": "trg_sync_location_position",
    "TRG_SYNC_TEACHER_COURSE_HOURS": "trg_sync_teacher_course_hours",
    "TRG_SYNC_TEACHER_COURSE_STATS_DELETE": "trg_sync_teacher_course_stats_delete",
    "TRG_SYNC_TEACHER_COURSE_STATS_INSERT": "trg_sync_teacher_course_stats_insert",
    "TRG_SYNC_TEACHER_COURSE_STATS_UPDATE": "trg_sync_teacher_course_stats_update",
    "TRG_UECOURSE_ARCHIVE_ORDER": "trg_uecourse_archive_order",
    "TRG_UECOURSE_DELETE_ORDER": "trg_uecourse_delete_order",
    "TRG_UECOURSE_INSERT_ORDER": "trg_uecourse_insert_order",
    "TRG_UECOURSE_RESTORE_ORDER": "trg_uecourse_restore_order",
    "TRIGGER_PREVENT_LOCKED_SCHEDULE_UPDATE": "trigger_prevent_locked_schedule_update",
    "TRIGGER_SYNC_SCHEDULE_DURING": "trigger_sync_schedule_during",
    "VALIDATE_STUDENT_CLASS_GROUP": "validate_student_class_group"
  },
  "VIEWS": {
    "SESSION_PRESENCE_MAP": "session_presence_map"
  },
  "BUCKETS": {},
  "POLICIES": {},
  "CRON_JOBS": {
    "PURGE_DELETED_NOTES": "purge-deleted-notes"
  },
  "DERIVED_COLUMNS": [
    {
      "table": "Location",
      "column": "position"
    },
    {
      "table": "Schedule",
      "column": "during"
    },
    {
      "table": "Session",
      "column": "position"
    }
  ],
  "EXCEPTION_MESSAGES": [
    "Ce cours ne peut pas être démarré (annulé ou manqué).",
    "Class % has no orgId through ProgramTrack",
    "Group % has no orgId through Class/ProgramTrack",
    "Impossible de modifier un schedule avec le status %",
    "Le groupe doit appartenir a la meme classe que l'enrollment",
    "Planning introuvable.",
    "Séance verrouillée : modification impossible",
    "Une session est déjà active pour ce cours.",
    "Vous êtes trop loin de la salle (% m, rayon autorisé : % m)."
  ]
} as const;

// Objets des fichiers marqués TEST_DB_SKIP : ils dépendent des schémas auth/storage de Supabase.
export const SUPABASE_OBJECTS = {
  "EXTENSIONS": {},
  "INDEXES": {},
  "UNIQUE_INDEXES": {},
  "CONSTRAINTS": {},
  "FUNCTIONS": {
    "GET_AUTH_USER_BY_EMAIL": "get_auth_user_by_email"
  },
  "TRIGGERS": {},
  "VIEWS": {},
  "BUCKETS": {
    "AVATARS": "avatars",
    "LOGOS": "logos"
  },
  "POLICIES": {
    "AVATARS_OWNER_DELETE": "avatars_owner_delete",
    "AVATARS_OWNER_INSERT": "avatars_owner_insert",
    "AVATARS_OWNER_UPDATE": "avatars_owner_update",
    "AVATARS_PUBLIC_READ": "avatars_public_read",
    "LOGOS_PUBLIC_READ": "logos_public_read",
    "LOGOS_RESPONSABLE_DELETE": "logos_responsable_delete",
    "LOGOS_RESPONSABLE_INSERT": "logos_responsable_insert",
    "LOGOS_RESPONSABLE_UPDATE": "logos_responsable_update"
  },
  "CRON_JOBS": {},
  "DERIVED_COLUMNS": [],
  "EXCEPTION_MESSAGES": []
} as const;

export type DatabaseObjects = typeof DATABASE_OBJECTS;
