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
  AUTH: {
    UNAUTHORIZED: 'Vous devez être connecté',
    FORBIDDEN: 'Accès non autorisé',
  },
  AUDIT_LOG: "[audit-log] Erreur lors de la journalisation",
  ORG: {
    NOT_FOUND: 'Organisation introuvable',
  },
  DB: {
    FOREIGN_KEY: 'Référence invalide',
    NOT_FOUND: 'Enregistrement introuvable',
  },
  UNIQUE: {
    DEFAULT: 'Cette valeur existe déjà',
  },
  NOT_FOUND: 'Ressource introuvable',
  SERVER: 'Une erreur serveur est survenue',

  // ⚠ À ÉTENDRE PAR PROJET — ajouter les familles d'erreurs métier
  // ENTITY: { NOT_FOUND: '...' },
} as const

export const sessionConfig = {
  thresholds: { checkIn: 15, checkOut: 15 },
  timer: { updateInterval: 30_000 },
  queryKeys: {
    todaySchedules: (teacherId: string) => ['today-schedules', teacherId] as const,
  },
  messages: {
    startSuccess: 'Session démarrée avec succès',
    startError: 'Erreur lors du démarrage de la session',
    endSuccess: 'Session terminée avec succès',
    endError: 'Erreur lors de la clôture de la session',
  },
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
