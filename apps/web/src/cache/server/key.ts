// src/cache/server/key.ts
// Registre central des clés/tags de cache serveur.
//
// Ce fichier ne contient QUE le vocabulaire métier du projet courant :
// quelles données sont cachées, avec quel profil de vie, quels services
// participent au graphe d'invalidation. Le mécanisme (key(), updateTag,
// try/catch silencieux) vit dans ./engine — ne rien y ajouter ici.
//
// Convention :
// - LISTE  => CACHE.X(scopeId)          → "x:<scopeId>"
// - DÉTAIL => CACHE.X(scopeId, id)      → "x:<scopeId>:<id>"
// - GLOBAL => CACHE.X()                 → "x" (rare : catalogue global, config…)
//
// `scopeId` = l'identifiant qui isole les données entre tenants/organisations
// dans CE projet (orgId, workspaceId…) — `key()` reste agnostique dessus.
//
// Côté query :    "use cache" + cacheTag(CACHE.X(scopeId)) + cacheLife(CACHE.X.life)
// Côté mutation :  invalidateEvent("X_CREATED", scopeId) — appelé depuis le
//                  cache.ts du service concerné (jamais depuis la query elle-même).
import { CACHE_LIFE, key, createInvalidators } from "./engine";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Imports des graphes par service
// ─────────────────────────────────────────────────────────────────────────────
// Chaque service qui possède des données cachées expose un <SERVICE>_GRAPH
// (dans <service>/cache.ts) : un mapping événement métier → fn qui retourne
// les tags à invalider. Importer ici uniquement les services concernés.
import { ORG_GRAPH } from "@/services/organization/cache";
import { ROOM_GRAPH } from "@/services/room/cache";
import { TERM_GRAPH } from "@/services/term/cache";
import { ACADEMIC_YEAR_GRAPH } from "@/services/academic-year/cache";
import { DEPARTMENT_GRAPH } from "@/services/department/cache";
import { UE_GRAPH } from "@/services/ue/cache";
import { PROGRAM_TRACK_GRAPH } from "@/services/program-track/cache";
import { UE_COURSE_GRAPH } from "@/services/ue-course/cache";
import { CLASS_GRAPH } from "@/services/class/cache";
import { GROUP_GRAPH } from "@/services/group/cache";
import { TEACHER_GRAPH } from "@/services/teacher/cache";
import { COURSE_GRAPH } from "@/services/course/cache";
import { STUDENT_GRAPH } from "@/services/student/cache";
import { SCHEDULE_GRAPH } from "@/services/schedule/cache";
import { SESSION_GRAPH } from "@/services/session/cache";
import { WEEKLY_TEMPLATE_GRAPH } from "@/services/weekly-template/cache";
import { TEACHER_UNAVAILABILITY_GRAPH } from "@/services/teacher-unavailability/cache";
import { EVENT_GRAPH } from "@/services/event/cache";
import { SUBSCRIPTION_GRAPH } from "@/services/subscription/cache";
import { FUNCTION_GRAPH } from "@/services/function/cache";
import { NOTIFICATION_GRAPH } from "@/services/notification/cache";
import { DIRECTION_GRAPH } from "@/services/direction/cache";
import { PROGRAM_GRAPH } from "@/services/program/cache";
// ⚠ À ÉTENDRE PAR PROJET — un import par service à données cachées :

// ─────────────────────────────────────────────────────────────────────────────
// 2. Registre CACHE — une entrée par donnée cachée
// ─────────────────────────────────────────────────────────────────────────────
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
  // ⚠ À ÉTENDRE PAR PROJET — une entrée par entité cachée :
  // ENTITY: key("entity"),
  // RESOURCE: key("resource", CACHE_LIFE.SHORT),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. Graphe d'invalidation — union des graphes par service
// ─────────────────────────────────────────────────────────────────────────────
export const CACHE_GRAPH = {
  ...ORG_GRAPH,
  ...ROOM_GRAPH,
  ...TERM_GRAPH,
  ...ACADEMIC_YEAR_GRAPH,
  ...DEPARTMENT_GRAPH,
  ...UE_GRAPH,
  ...PROGRAM_TRACK_GRAPH,
  ...UE_COURSE_GRAPH,
  ...CLASS_GRAPH,
  ...GROUP_GRAPH,
  ...TEACHER_GRAPH,
  ...COURSE_GRAPH,
  ...STUDENT_GRAPH,
  ...SCHEDULE_GRAPH,
  ...SESSION_GRAPH,
  ...WEEKLY_TEMPLATE_GRAPH,
  ...TEACHER_UNAVAILABILITY_GRAPH,
  ...EVENT_GRAPH,
  ...SUBSCRIPTION_GRAPH,
  ...FUNCTION_GRAPH,
  ...DIRECTION_GRAPH,
  ...PROGRAM_GRAPH,
  ...NOTIFICATION_GRAPH,
  // ⚠ À ÉTENDRE PAR PROJET — spreader chaque <SERVICE>_GRAPH importé :
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 4. Invalidation — ne pas réimplémenter, toujours passer par le moteur
// ─────────────────────────────────────────────────────────────────────────────
export const { invalidateCache, invalidateEvent } = createInvalidators(
  CACHE,
  CACHE_GRAPH
);

// Ré-export pratique : les call sites qui posent juste cacheLife(CACHE.X.life)
// n'ont besoin que de ce fichier, pas d'importer ./engine directement.
export { CACHE_LIFE };
export type { CacheLifeProfile } from "./engine";
