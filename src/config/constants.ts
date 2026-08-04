// src/config/constants.ts
// Constantes transverses : forme de réponse des actions + messages d'erreur.
//
// ApiResponse<T> est LE contrat de retour de toutes les server actions :
//   succès → { data: T }   échec → { error: string }
// Jamais de throw vers le client, jamais de discriminated union { ok: ... }.

export type ApiResponse<T> =
  | { data: T }
  | { error: string }

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


  UNIQUE: {
    DEFAULT: "Cette valeur est déjà utilisée",
    EMAIL: "Cet email est déjà utilisé",
    CODE: "Ce code existe déjà",
    NAME: "Ce nom est déjà utilisé",
  },

  DB: {
    NOT_FOUND: "la Resource est introuvable",
    FOREIGN_KEY: "Impossible de supprimer cet élément car il est utilisé ailleurs",
    OVERLAP: "Conflit de planification détecté",
  },

    AUTH: {
    UNAUTHORIZED: "Not authenticated, please login first.",
    FORBIDDEN: "Accès non autorisé",
  },
} as const;


type ErrorResponse = Extract<ApiResponse<any>, { error: string }>;
export const ERROR_KEY: keyof ErrorResponse = "error";


export const PRISMA_UNIQUE_MAP: Record<string, string> = {
  code: ERRORS.UNIQUE.CODE,
  email: ERRORS.UNIQUE.EMAIL,
  name: ERRORS.UNIQUE.NAME,
};

export const DB_CONSTRAINTS = {
  ROOM_OVERLAP: "no_room_overlap",
  TEACHER_OVERLAP: "no_teacher_overlap",
  CLASS_OVERLAP: "no_class_overlap_global",
  GROUP_OVERLAP: "no_group_overlap",
} as const

// Mapping contrainte DB → message utilisateur, consommé par tryConstraint()
// (utils/server/prisma.ts). Clé = nom de la contrainte Postgres.
// ⚠ À ÉTENDRE PAR PROJET
export const CONSTRAINT_ERROR: Record<string, string> = {
  'AcademicYear_name_orgId_key': 'Une année avec ce nom existe déjà',
  'Department_name_orgId_key': 'Un département avec ce nom existe déjà',
  'UE_code_orgId_key': 'Un code UE identique existe déjà dans cette organisation',
  'UE_name_departmentId_key': 'Une UE avec ce nom existe déjà dans ce département',
  'ProgramTrack_name_departmentId_key': 'Une filière avec ce nom existe déjà dans ce département',
  'Program_name_programTrackId_key': 'Une maquette avec ce nom existe déjà dans cette filière',
  'ProgramUE_programId_ueId_key': 'Cette UE est déjà dans ce programme',
  'UECourse_name_ueId_key': 'Une matière avec ce nom existe déjà dans cette UE',
  'Class_programTrackId_name_academicYearId_key': 'Une classe avec ce nom existe déjà dans cette filière pour cette année',
  'CourseTeacher_teacherId_courseId_key': 'Cet enseignant est déjà assigné à ce cours',
  'StudentEnrollment_studentId_classId_key': 'Cet étudiant est déjà inscrit dans cette classe',
  'StudentGroup_enrollmentId_groupId_key': 'Cet étudiant est déjà dans ce groupe',
}

// Mapping message de trigger SQL → message utilisateur, consommé par tryConstraint().
// Clé = fragment du message levé par le trigger Postgres.
// ⚠ À ÉTENDRE PAR PROJET
export const TRIGGER_ERROR: Record<string, string> = {
  'no_room_overlap': 'Conflit de salle : une séance occupe déjà ce créneau',
  'no_teacher_overlap': 'Conflit enseignant : ce professeur est déjà pris sur ce créneau',
  'no_class_overlap_global': 'Conflit de classe : une séance est déjà planifiée sur ce créneau',
  'no_group_overlap': 'Conflit de groupe : ce groupe a déjà une séance sur ce créneau',
  'Impossible de modifier un schedule': 'Séance non modifiable : statut figé',
}
