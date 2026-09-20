// src/services/teacher-course-hours/policy.ts
//
// Logique PURE du service TeacherCourseHours — pas de DB, pas de React,
// testable en isolation. Ce service est distinct de teacher-course
// (relation CourseTeacher : qui enseigne quoi, hours PRÉVISIONNEL,
// isMain) — TeacherCourseHours exprime le RÉALISÉ effectif, décomposé
// par type de séance (scheduleType), dérivé de Schedule. Cardinalité
// différente : 1 ligne CourseTeacher par affectation, 1 ligne
// TeacherCourseHours par (teacher, course, scheduleType).
//
// Source de vérité du calcul : le trigger DB
// `sync_teacher_course_hours_stats` (post-migrate/40_schedule.sql).
// Ce fichier NE RECALCULE RIEN côté lecture — TeacherCourseHours.completedHours
// est déjà agrégé en base par le trigger. Les fonctions ci-dessous documentent
// la même formule (pour un usage de simulation / preview UI avant clôture,
// ou pour des tests) et exposent les types/garde-fous partagés.

import type { ScheduleType, Schedule } from "@/generated/prisma/browser"

// ─────────────────────────────────────────────────────────────────────────────
// FORMULE — identique à sync_teacher_course_hours_stats (SQL)
// ─────────────────────────────────────────────────────────────────────────────
//
// Durée d'une séance, en heures décimales :
//
//   duration = EXTRACT(EPOCH FROM (endTime - startTime)) / 3600.0
//
// Clé d'agrégation (unique côté DB — @@unique([teacherId, courseId, scheduleType])) :
//
//   (teacherId, courseId, scheduleType)
//
// Règle d'inclusion — une séance compte si et seulement si :
//
//   status = 'COMPLETED' AND deletedAt IS NULL
//
// Transition ENTRANTE (le trigger ADDITIONNE la durée) :
//   INSERT avec status = COMPLETED, deletedAt NULL
//   UPDATE où NEW.status = COMPLETED AND NEW.deletedAt IS NULL
//          ET (OLD.status IS DISTINCT FROM COMPLETED OR OLD.deletedAt IS NOT NULL)
//   → completedHours += duration   (UPSERT, ON CONFLICT DO UPDATE)
//
// Transition SORTANTE (le trigger RETRANCHE la durée) :
//   DELETE d'une ligne qui était COMPLETED + non soft-deleted
//   UPDATE où OLD.status = COMPLETED AND OLD.deletedAt IS NULL
//          ET (NEW.status <> COMPLETED OR NEW.deletedAt IS NOT NULL)
//   → completedHours = GREATEST(0, completedHours - duration)
//
// Garde structurelle : scheduleType (comme courseId/teacherId/startTime/endTime)
// est FIGÉ dès qu'un Schedule quitte PENDING — trigger
// prevent_locked_schedule_update (40_schedule.sql) étendu à cette colonne.
// Conséquence : AUCUNE transition "COMPLETED reste COMPLETED mais scheduleType
// change" n'est possible → le trigger n'a jamais à gérer un transfert de clé
// (retrait d'un compteur + ajout dans un autre). C'est ce qui rend l'UPSERT
// incrémental sûr sans jamais lire l'ancienne valeur de scheduleType.
// ─────────────────────────────────────────────────────────────────────────────

export type ScheduleForHours = Pick<
  Schedule,
  "startTime" | "endTime" | "status" | "deletedAt" | "scheduleType"
>;

/**
 * Durée d'une séance en heures décimales — même formule que le trigger SQL.
 * Pure, ne regarde ni status ni deletedAt (c'est le rôle de countsTowardHours).
 */
export function scheduleDurationHours(
  slot: Pick<ScheduleForHours, "startTime" | "endTime">,
): number {
  const ms = new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime();
  return ms / 1000 / 3600;
}

/**
 * Un Schedule compte dans TeacherCourseHours ssi COMPLETED et non soft-deleted.
 * Miroir exact de la condition WHERE du trigger — ne pas diverger.
 */
export function countsTowardHours(schedule: ScheduleForHours): boolean {
  return schedule.status === "COMPLETED" && schedule.deletedAt === null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGRÉGATION EN MÉMOIRE — simulation / preview côté lecture
// ─────────────────────────────────────────────────────────────────────────────
//
// Usage : preview "heures réalisées si je clôture ces séances maintenant"
// (avant qu'elles ne soient COMPLETED en DB, donc avant que le trigger ne les
// compte), ou recalcul de contrôle en test d'intégration. Ne PAS utiliser ceci
// comme source de lecture en prod — lire TeacherCourseHours.completedHours
// directement (déjà agrégé, O(1), pas de scan Schedule).

export type ScheduleTypeHoursMap = Partial<Record<ScheduleType, number>>;

/**
 * Agrège un lot de Schedule en heures par scheduleType — même filtre/formule
 * que le trigger. Utilisé pour vérifier l'invariant en test d'intégration
 * (Σ hours calculées ici === TeacherCourseHours.completedHours en DB) ou pour
 * une simulation avant clôture réelle.
 */
export function aggregateHoursByScheduleType(
  schedules: ScheduleForHours[],
): ScheduleTypeHoursMap {
  const result: ScheduleTypeHoursMap = {};
  for (const s of schedules) {
    if (!countsTowardHours(s)) continue;
    const prev = result[s.scheduleType] ?? 0;
    result[s.scheduleType] = prev + scheduleDurationHours(s);
  }
  return result;
}