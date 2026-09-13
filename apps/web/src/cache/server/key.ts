// src/cache/server/key.ts
//
// Registre PUR des clés de cache — uniquement CACHE, zéro dépendance vers un
// service métier. Ce découpage existe pour casser le cycle d'imports avec
// ./graph.ts (qui, lui, importe les *_GRAPH de chaque service pour construire
// CACHE_GRAPH) : si un `services/<x>/cache.ts` importait CACHE depuis
// ./graph.ts, chaque import de CACHE forcerait l'évaluation de TOUS les
// *_GRAPH — y compris celui du service en cours d'évaluation — d'où le
// "Cannot access '<X>_GRAPH' before initialization" selon l'ordre de
// chargement des modules.
//
// Règle : tout src/services/<x>/cache.ts qui exporte un <X>_GRAPH DOIT
// importer CACHE depuis CE fichier (jamais depuis ./graph). Les autres
// consommateurs (query.ts, actions, composants…) peuvent importer CACHE
// depuis ici ou depuis ./graph (qui le ré-exporte) — les deux sont sûrs
// tant qu'ils n'exportent pas eux-mêmes un *_GRAPH consommé par ./graph.
import { key } from "./engine";

export const CACHE = {
  ORG: key("org"),
  ROOM: key("room"),
  CLASS: key("class"),
  GROUP: key("group"),
  ACADEMIC_YEAR: key("academic-year"),
  DEPARTMENT: key("department"),
  UE: key("ue"),
  PROGRAM_TRACK: key("program-track"),
  UE_COURSE: key("ue-course"),
  TEACHER: key("teacher"),
  COURSE: key("course"),
  STUDENT: key("student"),
  SCHEDULE: key("schedule"),
  SESSION: key("session"),
  WEEKLY_TEMPLATE: key("weekly-template"),
  TEACHER_UNAVAILABILITY: key("teacher-unavailability"),
  EVENT: key("event"),
  SUBSCRIPTION: key("subscription"),
  PLAN: key("plan"),
  FUNCTION: key("function"),
  NOTIFICATION: key("notification"),
  DIRECTION: key("direction"),
  PROGRAM: key("program"),
  COURSE_TEACHER: key("course-teacher"),
  UE_TEMPLATE: key("ue-template"),
  REFERENTIAL: key("referential"),
  PROGRAM_TEMPLATE: key("program-template"),
  ORG_PROGRAM_TEMPLATE: key("org-program-template"),
  ORG_UE_TEMPLATE: key("org-ue-template"),
  USER: key("user"),
  TERM: key("term"),
  CURRICULUM: key("curriculum"),
  STUDENT_ENROLLMENT: key("student-enrollment"),
  USER_ORGANIZATION: key("user-organization"),
  USER_DEVICES: key("user-devices"),
  USER_SESSIONS: key("user-sessions"),
  USER_SESSION: key("user-session"),
  USER_FUNCTIONS: key("user-functions"),
  PERMISSION: key("permission"),
// ⚠ À ÉTENDRE PAR PROJET — une entrée par entité cachée :
  // ENTITY: key("entity"),
  // RESOURCE: key("resource", CACHE_LIFE.SHORT),
} as const;