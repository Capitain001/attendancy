// src/generated/referentiel.ts
//
// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer via : npx tsx scripts/generate/referentiel/referentiel.ts
//
// Classification MODEL vs DOMAIN dérivée par comparaison exacte du
// kebab-case des dossiers de src/services/ avec le kebab-case des modèles
// Prisma (prisma/schemas/*.prisma). Dossier sans modèle correspondant →
// DOMAIN par défaut (orchestrateur par construction).
//
// Limite assumée : matching EXACT uniquement. Un dossier de service MODEL
// renommé pour ne plus matcher son modèle serait ici classé DOMAIN par
// erreur — c'est le seul cas nécessitant un override manuel, voir
// src/services/referentiel.ts.

export const ServiceType = {
  MODEL: 'MODEL',
  DOMAIN: 'DOMAIN',
} as const

export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType]

export const MODEL_SERVICES = {
  'academic-year': { model: 'AcademicYear', path: '../services/academic-year' },
  'attendance': { model: 'Attendance', path: '../services/attendance' },
  'class': { model: 'Class', path: '../services/class' },
  'course': { model: 'Course', path: '../services/course' },
  'course-teacher': { model: 'CourseTeacher', path: '../services/course-teacher' },
  'department': { model: 'Department', path: '../services/department' },
  'direction': { model: 'Direction', path: '../services/direction' },
  'event': { model: 'Event', path: '../services/event' },
  'function': { model: 'Function', path: '../services/function' },
  'group': { model: 'Group', path: '../services/group' },
  'notification': { model: 'Notification', path: '../services/notification' },
  'organization': { model: 'Organization', path: '../services/organization' },
  'parent': { model: 'Parent', path: '../services/parent' },
  'program': { model: 'Program', path: '../services/program' },
  'program-track': { model: 'ProgramTrack', path: '../services/program-track' },
  'program-ue': { model: 'ProgramUE', path: '../services/program-ue' },
  'room': { model: 'Room', path: '../services/room' },
  'schedule': { model: 'Schedule', path: '../services/schedule' },
  'session': { model: 'Session', path: '../services/session' },
  'student': { model: 'Student', path: '../services/student' },
  'student-enrollment': { model: 'StudentEnrollment', path: '../services/student-enrollment' },
  'subscription': { model: 'Subscription', path: '../services/subscription' },
  'teacher': { model: 'Teacher', path: '../services/teacher' },
  'teacher-unavailability': { model: 'TeacherUnavailability', path: '../services/teacher-unavailability' },
  'term': { model: 'Term', path: '../services/term' },
  'ue': { model: 'UE', path: '../services/ue' },
  'ue-course': { model: 'UECourse', path: '../services/ue-course' },
  'ue-template': { model: 'UETemplate', path: '../services/ue-template' },
  'user': { model: 'User', path: '../services/user' },
  'user-organization': { model: 'UserOrganization', path: '../services/user-organization' },
  'weekly-template': { model: 'WeeklyTemplate', path: '../services/weekly-template' },
} satisfies Record<string, { model: string; path: string }>

export const DOMAIN_SERVICES = {
  'chat': { path: '../services/chat' },
  'curriculum': { path: '../services/curriculum' },
  'device': { path: '../services/device' },
  'entity': { path: '../services/entity' },
  'planning': { path: '../services/planning' },
  'seed': { path: '../services/seed' },
} satisfies Record<string, { path: string }>

export type ModelServiceName = keyof typeof MODEL_SERVICES
export type DomainServiceName = keyof typeof DOMAIN_SERVICES

export function getServiceType(folderName: string): ServiceType | null {
  if (folderName in MODEL_SERVICES) return ServiceType.MODEL
  if (folderName in DOMAIN_SERVICES) return ServiceType.DOMAIN
  return null
}

// ─── Vérification compile-time des chemins ──────────────────────────────
// Alias jamais utilisés comme valeurs — forcent TypeScript à résoudre
// chaque index au moment de la compilation. Exportés (pas de warning
// ts(6196) "declared but never used").
export type AcademicYearServiceIndex = typeof import('../services/academic-year')
export type AttendanceServiceIndex = typeof import('../services/attendance')
export type ChatServiceIndex = typeof import('../services/chat')
export type ClassServiceIndex = typeof import('../services/class')
export type CourseServiceIndex = typeof import('../services/course')
export type CourseTeacherServiceIndex = typeof import('../services/course-teacher')
export type CurriculumServiceIndex = typeof import('../services/curriculum')
export type DepartmentServiceIndex = typeof import('../services/department')
export type DeviceServiceIndex = typeof import('../services/device')
export type DirectionServiceIndex = typeof import('../services/direction')
export type EntityServiceIndex = typeof import('../services/entity')
export type EventServiceIndex = typeof import('../services/event')
export type FunctionServiceIndex = typeof import('../services/function')
export type GroupServiceIndex = typeof import('../services/group')
export type NotificationServiceIndex = typeof import('../services/notification')
export type OrganizationServiceIndex = typeof import('../services/organization')
export type ParentServiceIndex = typeof import('../services/parent')
export type PlanningServiceIndex = typeof import('../services/planning')
export type ProgramServiceIndex = typeof import('../services/program')
export type ProgramTrackServiceIndex = typeof import('../services/program-track')
export type ProgramUeServiceIndex = typeof import('../services/program-ue')
export type RoomServiceIndex = typeof import('../services/room')
export type ScheduleServiceIndex = typeof import('../services/schedule')
export type SeedServiceIndex = typeof import('../services/seed')
export type SessionServiceIndex = typeof import('../services/session')
export type StudentServiceIndex = typeof import('../services/student')
export type StudentEnrollmentServiceIndex = typeof import('../services/student-enrollment')
export type SubscriptionServiceIndex = typeof import('../services/subscription')
export type TeacherServiceIndex = typeof import('../services/teacher')
export type TeacherUnavailabilityServiceIndex = typeof import('../services/teacher-unavailability')
export type TermServiceIndex = typeof import('../services/term')
export type UeServiceIndex = typeof import('../services/ue')
export type UeCourseServiceIndex = typeof import('../services/ue-course')
export type UeTemplateServiceIndex = typeof import('../services/ue-template')
export type UserServiceIndex = typeof import('../services/user')
export type UserOrganizationServiceIndex = typeof import('../services/user-organization')
export type WeeklyTemplateServiceIndex = typeof import('../services/weekly-template')
