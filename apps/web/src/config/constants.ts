// src/config/constants.ts
// Constantes transverses : forme de réponse des actions + messages d'erreur.
//
// ApiResponse<T> est LE contrat de retour de toutes les server actions :
//   succès → { data: T }   échec → { error: string, code?: ErrorCode }
// Jamais de throw vers le client, jamais de discriminated union { ok: ... }.

import { UI } from "./ui";
import { DATABASE_OBJECTS as DB } from "@/generated/db-objects";
import { DATABASE_CONSTRAINTS as SCHEMA } from "@/generated/db-constraints";

export type ApiResponse<T> =
  | { data: T }
  | { error: string; code?: ErrorCode }
//code introduit recement pour permetre de specifier les erreur pr les clients externes 

export const ERRORS = {
  // AUTH: "Not authenticated, please login first.",
  // FORBIDDEN: "You don't have permission to access this resource.",
  NOT_FOUND: "Resource not found.",
  BAD_REQUEST: "Bad request.",
  SERVER: "Internal server error.",
  AUDIT_LOG: "[audit-log] Erreur lors de la journalisation",
  ORG: {
    NOT_FOUND: "Organisation non trouvée",
  },
  SCHEDULE: {
    CONFLICT: "CONFLICT_SCHEDULE",
    //MESSAGES
    CONFLICT_MESSAGE: "Conflit détecté (salle ou enseignant déjà réservé) sur ce créneau",
  },
  UI,

  UNIQUE: {
    DEFAULT: "Cette valeur est déjà utilisée",
    EMAIL: "Cet email est déjà utilisé",
    CODE: "Ce code existe déjà",
    NAME: "Ce nom est déjà utilisé",
    ID: "Cet identifiant est déjà utilisé",
  },

  DB: {
    NOT_FOUND: "la Resource est introuvable",
    FOREIGN_KEY: "Impossible de supprimer cet élément car il est utilisé ailleurs",
    OVERLAP: "Conflit de planification détecté",
    UNREACHABLE: "Service temporairement indisponible — réessayez dans quelques instants",
  },

  AUTH: {
    UNAUTHORIZED: "Not authenticated, please login first.",
    FORBIDDEN: "Accès non autorisé",
    PROFILE: "Profil requis introuvable",
  },
} as const;


type ErrorResponse = Extract<ApiResponse<any>, { error: string }>;
export const ERROR_KEY: keyof ErrorResponse = "error";

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  SERVER: 'SERVER',
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  CONFLICT: 'CONFLICT',         // doublon, trigger, conflit d'id : ne pas réessayer tel quel
  UNAVAILABLE: 'UNAVAILABLE',   // base injoignable : réessayer plus tard
  VALIDATION: 'VALIDATION',     // entrée invalide : corriger puis renvoyer
} as const satisfies Record<string, string>

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]



export const PRISMA_UNIQUE_MAP: Record<string, string> = {
  code: ERRORS.UNIQUE.CODE,
  email: ERRORS.UNIQUE.EMAIL,
  name: ERRORS.UNIQUE.NAME,
};

// Toutes les contraintes du SQL, sous leur nom généré.
export const DB_CONSTRAINTS = {
  ...DB.CONSTRAINTS,
} as const

type UniqueConstraintName =
  | (typeof SCHEMA.UNIQUES)[keyof typeof SCHEMA.UNIQUES]
  | (typeof DB.UNIQUE_INDEXES)[keyof typeof DB.UNIQUE_INDEXES]

type ForeignKeyName = (typeof SCHEMA.FOREIGN_KEYS)[keyof typeof SCHEMA.FOREIGN_KEYS]

// Mapping contrainte DB → message utilisateur, consommé par tryConstraint()
// (utils/server/prisma.ts). Clé = nom de la contrainte Postgres.
const UNIQUE_CONSTRAINT_ERROR = {
  // ── Utilisateurs / Organisations ────────────────────────────────────────────
  [SCHEMA.UNIQUES.USER_EMAIL_KEY]: 'Cet email est déjà utilisé',
  [SCHEMA.UNIQUES.USER_PHONE_KEY]: 'Ce numéro de téléphone est déjà utilisé',
  [SCHEMA.UNIQUES.SUPER_ADMIN_EMAIL_KEY]: 'Cet email est déjà utilisé',
  [SCHEMA.UNIQUES.ORGANIZATION_INSTITUTION_NAME_UNIQUE]: "Ce nom d'organisation est déjà pris",
  [SCHEMA.UNIQUES.ORGANIZATION_EMAIL_KEY]: "Cet email d'organisation est déjà utilisé",
  [SCHEMA.UNIQUES.ORGANIZATION_SLUG_KEY]: 'Ce slug est déjà pris',
  [SCHEMA.UNIQUES.ORGANIZATION_DOMAIN_KEY]: 'Ce domaine est déjà utilisé',
  [SCHEMA.UNIQUES.ORGANIZATION_SETTINGS_ORG_ID_KEY]: 'Les paramètres de cette organisation existent déjà',
  [SCHEMA.UNIQUES.ORGANIZATION_USAGE_ORG_ID_KEY]: "Les statistiques d'usage de cette organisation existent déjà",
  [SCHEMA.UNIQUES.USER_ORGANIZATION_USER_ID_ORG_ID_KEY]: 'Cet utilisateur est déjà membre de cette organisation',
  [SCHEMA.UNIQUES.USER_DEVICE_USER_ID_DEVICE_ID_KEY]: 'Cet appareil est déjà enregistré pour cet utilisateur',
  [SCHEMA.UNIQUES.PUSH_SUBSCRIPTION_ENDPOINT_KEY]: 'Cet abonnement push existe déjà',
  [SCHEMA.UNIQUES.PUSH_SUBSCRIPTION_ENDPOINT_USER_ID_KEY]: 'Cet abonnement push est déjà lié à cet utilisateur',

  // ── Profils par rôle ────────────────────────────────────────────────────────
  [SCHEMA.UNIQUES.ADMIN_USER_ID_KEY]: 'Un profil admin existe déjà pour cet utilisateur',
  [SCHEMA.UNIQUES.TEACHER_USER_ID_ORG_ID_KEY]: 'Un profil enseignant existe déjà pour cet utilisateur dans cette organisation',
  [SCHEMA.UNIQUES.STUDENT_USER_ID_ORG_ID_KEY]: 'Un profil étudiant existe déjà pour cet utilisateur dans cette organisation',
  [SCHEMA.UNIQUES.PARENT_USER_ID_ORG_ID_KEY]: 'Un profil parent existe déjà pour cet utilisateur dans cette organisation',
  [SCHEMA.UNIQUES.DIRECTION_USER_ID_ORG_ID_KEY]: 'Un profil direction existe déjà pour cet utilisateur dans cette organisation',
  [SCHEMA.UNIQUES.PARENT_RELATION_PARENT_ID_STUDENT_ID_KEY]: 'Ce parent est déjà lié à cet étudiant',

  // ── Fonctions / RBAC ────────────────────────────────────────────────────────
  [SCHEMA.UNIQUES.FUNCTION_NAME_ORG_ID_KEY]: 'Une fonction avec ce nom existe déjà dans cette organisation',
  [SCHEMA.UNIQUES.USER_FUNCTION_USER_ID_FUNCTION_ID_KEY]: 'Cet utilisateur a déjà cette fonction',

  // ── Académique & Référentiels ───────────────────────────────────────────────
  [SCHEMA.UNIQUES.ACADEMIC_YEAR_NAME_ORG_ID_KEY]: 'Une année avec ce nom existe déjà',
  [SCHEMA.UNIQUES.DEPARTMENT_NAME_ORG_ID_KEY]: 'Un département avec ce nom existe déjà',
  [SCHEMA.UNIQUES.UE_CODE_ORG_ID_KEY]: 'Un code UE identique existe déjà dans cette organisation',
  [SCHEMA.UNIQUES.UE_NAME_DEPARTMENT_ID_KEY]: 'Une UE avec ce nom existe déjà dans ce département',
  [SCHEMA.UNIQUES.PROGRAM_TRACK_NAME_DEPARTMENT_ID_KEY]: 'Une filière avec ce nom existe déjà dans ce département',
  [SCHEMA.UNIQUES.PROGRAM_NAME_PROGRAM_TRACK_ID_KEY]: 'Une maquette avec ce nom existe déjà dans cette filière',
  [SCHEMA.UNIQUES.PROGRAM_UE_PROGRAM_ID_UE_ID_KEY]: 'Cette UE est déjà dans ce programme',
  [SCHEMA.UNIQUES.PROGRAM_UE_PROGRAM_ID_SEMESTER_ORDER_KEY]: 'Une UE occupe déjà cette position dans ce semestre',
  [SCHEMA.UNIQUES.UECOURSE_NAME_UE_ID_KEY]: 'Une matière avec ce nom existe déjà dans cette UE',
  [SCHEMA.UNIQUES.UECOURSE_UE_ID_ORDER_KEY]: 'Cette position est déjà occupée dans cette UE',
  [SCHEMA.UNIQUES.CLASS_PROGRAM_TRACK_ID_NAME_ACADEMIC_YEAR_ID_KEY]: 'Une classe avec ce nom existe déjà dans cette filière pour cette année',
  [SCHEMA.UNIQUES.COURSE_TEACHER_TEACHER_ID_COURSE_ID_KEY]: 'Cet enseignant est déjà assigné à ce cours',
  [SCHEMA.UNIQUES.TEACHER_COURSE_HOURS_TEACHER_ID_COURSE_ID_SCHEDULE_TYPE_KEY]: 'Un compteur horaire existe déjà pour cet enseignant sur ce cours',
  [SCHEMA.UNIQUES.STUDENT_ENROLLMENT_STUDENT_ID_CLASS_ID_KEY]: 'Cet étudiant est déjà inscrit dans cette classe',
  [SCHEMA.UNIQUES.STUDENT_ENROLLMENT_ID_STUDENT_ID_KEY]: "Cet identifiant d'inscription est déjà utilisé",
  [SCHEMA.UNIQUES.STUDENT_GROUP_ENROLLMENT_ID_GROUP_ID_KEY]: 'Cet étudiant est déjà dans ce groupe',
  [SCHEMA.UNIQUES.GROUP_COURSE_ID_KEY]: 'Un groupe existe déjà pour ce cours',
  [SCHEMA.UNIQUES.TERM_CLASS_ID_ORDER_KEY]: 'Un semestre avec cet ordre existe déjà pour cette classe',
  [SCHEMA.UNIQUES.GRADE_EVALUATION_ID_ENROLLMENT_ID_KEY]: 'Une note est déjà enregistrée pour cet étudiant sur cette évaluation',
  [SCHEMA.UNIQUES.OPTIONAL_UE_STUDENT_ID_UE_ID_YEAR_ID_KEY]: 'Cet étudiant a déjà inscrit cette UE en option pour cette année',
  [SCHEMA.UNIQUES.PROGRAM_TEMPLATE_REFERENTIAL_ID_DOMAIN_MENTION_SPECIALTY_KEY]: 'Un modèle de programme identique existe déjà dans ce référentiel',
  [SCHEMA.UNIQUES.ORG_PROGRAM_TEMPLATE_ORG_ID_PROGRAM_TEMPLATE_ID_KEY]: 'Ce modèle de programme est déjà associé à cette organisation',
  [SCHEMA.UNIQUES.UETEMPLATE_REFERENTIAL_ID_CODE_KEY]: "Un modèle d'UE avec ce code existe déjà dans ce référentiel",
  [SCHEMA.UNIQUES.ORG_UETEMPLATE_TEMPLATE_ID_ORG_ID_KEY]: "Ce modèle d'UE est déjà associé à cette organisation",
  [SCHEMA.UNIQUES.PROGRAM_UETEMPLATE_PROGRAM_ID_UE_TEMPLATE_ID_KEY]: "Ce modèle d'UE est déjà présent dans ce programme",
  [SCHEMA.UNIQUES.PROGRAM_UETEMPLATE_PROGRAM_ID_SEMESTER_ORDER_KEY]: 'Un modèle occupe déjà cette position dans ce semestre',
  [SCHEMA.UNIQUES.UETEMPLATE_EC_TEMPLATE_ID_CODE_KEY]: 'Un EC avec ce code existe déjà dans ce modèle',
  [SCHEMA.UNIQUES.UETEMPLATE_EC_TEMPLATE_ID_ORDER_KEY]: 'Un EC occupe déjà cette position dans ce modèle',

  // ── Planning / Salles / Présences / Sessions ────────────────────────────────
  [SCHEMA.UNIQUES.ROOM_NAME_ORG_ID_KEY]: 'Une salle avec ce nom existe déjà',
  [SCHEMA.UNIQUES.ATTENDANCE_SCHEDULE_ID_STUDENT_ID_KEY]: 'Une présence est déjà enregistrée pour cet étudiant sur cette séance',
  [SCHEMA.UNIQUES.SESSION_SCHEDULE_ID_KEY]: 'Une session est déjà ouverte pour cette séance',
  [SCHEMA.UNIQUES.SESSION_TOKEN_TOKEN_KEY]: 'Ce jeton de session existe déjà',
  [SCHEMA.UNIQUES.QRCODE_CODE_KEY]: 'Ce QR code existe déjà',
  [SCHEMA.UNIQUES.INVITATION_TOKEN_KEY]: "Ce jeton d'invitation existe déjà",

  // ── Index uniques SQL (post-migrate) ────────────────────────────────────────
  [DB.UNIQUE_INDEXES.PERMISSION_USER_SCOPE_UNIQUE_IDX]: 'Cette permission existe déjà pour cet utilisateur',
  [DB.UNIQUE_INDEXES.PERMISSION_FUNCTION_SCOPE_UNIQUE_IDX]: 'Cette permission existe déjà pour cette fonction',
  [DB.UNIQUE_INDEXES.COURSE_ACTIVE_UNIQUE_IDX]: 'Cette matière est déjà active dans cette classe',
  [DB.UNIQUE_INDEXES.UECOURSE_ACTIVE_NAME_UNIQUE_IDX]: 'Une matière avec ce nom existe déjà dans cette UE',
  [DB.UNIQUE_INDEXES.UECOURSE_ACTIVE_ORDER_UNIQUE_IDX]: 'Cette position est déjà occupée dans cette UE',
  [DB.UNIQUE_INDEXES.JUSTIFICATION_PENDING_UNIQUE_IDX]: 'Une justification est déjà en attente pour cet étudiant sur cette séance',
  [DB.UNIQUE_INDEXES.SHARE_NOTE_AUDIENCE_UNIQUE_IDX]: 'Cette note est déjà partagée avec cette audience',

  // ── Communication ─────────────────────────────────────────────────────────────
  [SCHEMA.UNIQUES.CHANNEL_MEMBER_CHANNEL_ID_USER_ID_KEY]: 'Cet utilisateur est déjà membre de ce canal',
  [SCHEMA.UNIQUES.CHANNEL_CLASS_ID_TYPE_KEY]: 'Un canal de ce type existe déjà pour cette classe',
  [SCHEMA.UNIQUES.CHANNEL_GROUP_ID_TYPE_KEY]: 'Un canal de ce type existe déjà pour ce groupe',
  [SCHEMA.UNIQUES.EVENT_PARTICIPANT_EVENT_ID_USER_ID_KEY]: 'Cet utilisateur participe déjà à cet événement',
  [SCHEMA.UNIQUES.REALTIME_ITEM_ITEM_ID_CHANNEL_ID_KEY]: 'Cet élément est déjà présent dans ce canal',
} as const satisfies Record<UniqueConstraintName, string>

const FK_CONSTRAINT_ERROR = {
  [SCHEMA.FOREIGN_KEYS.MESSAGE_CHANNEL_ID_FKEY]: 'Canal introuvable',
  [SCHEMA.FOREIGN_KEYS.MESSAGE_PARENT_ID_FKEY]: 'Message parent introuvable',
} as const satisfies Partial<Record<ForeignKeyName, string>>

export const CONSTRAINT_ERROR = {
  ...UNIQUE_CONSTRAINT_ERROR,
  ...FK_CONSTRAINT_ERROR,
} as const

// Noms des contraintes connues : auto-suggestion et erreur de compilation sur une faute de frappe.
export type ConstraintName = keyof typeof CONSTRAINT_ERROR

// Mapping message de trigger SQL → message utilisateur, consommé par tryConstraint().
// Clé = fragment du message levé par le trigger Postgres.
// ⚠ À ÉTENDRE PAR PROJET
export const TRIGGER_ERROR: Record<string, string> = {
  [DB.CONSTRAINTS.NO_ROOM_OVERLAP]: 'Conflit de salle : une séance occupe déjà ce créneau',
  [DB.CONSTRAINTS.NO_TEACHER_OVERLAP]: 'Conflit enseignant : ce professeur est déjà pris sur ce créneau',
  [DB.CONSTRAINTS.NO_CLASS_OVERLAP_GLOBAL]: 'Conflit de classe : une séance est déjà planifiée sur ce créneau',
  [DB.CONSTRAINTS.NO_GROUP_OVERLAP]: 'Conflit de groupe : ce groupe a déjà une séance sur ce créneau',
  'Impossible de modifier un schedule': 'Séance non modifiable : statut figé',
  'Séance verrouillée': 'Séance verrouillée : modification impossible',

}