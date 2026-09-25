// src/services/teacher-unavailability/policy.ts
// Logique pure (sans React, sans DB), importable côté client comme serveur.
// Remplace les deux copies de `isItemActiveOnDate` (écran + calendrier).

import type { TeacherUnavailabilityItem } from "./types";

export type UnavailabilityRule = Pick<
  TeacherUnavailabilityItem,
  "dayOfWeek" | "startDate" | "endDate" | "startTime" | "endTime"
>;

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" d'un jour du calendrier (date locale, telle que choisie par l'utilisateur). */
const localDayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "YYYY-MM-DD" d'une date stockée en base (colonne date, minuit UTC). */
const storedDayKey = (d: Date) => new Date(d).toISOString().slice(0, 10);

const minutesUTC = (d: Date) => new Date(d).getUTCHours() * 60 + new Date(d).getUTCMinutes();

/** Jour ISO : 1 = lundi … 7 = dimanche. */
export function isoDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/**
 * La règle concerne-t-elle ce jour ? (les heures ne sont pas prises en compte :
 * une absence de 8h à 10h « concerne » le jour, utile pour l'affichage du calendrier)
 * Comparaison par clés "YYYY-MM-DD" : insensible aux fuseaux horaires.
 */
export function appliesOnDay(rule: UnavailabilityRule, date: Date): boolean {
  const hasWeeklyConstraint = rule.dayOfWeek != null;
  const hasRangeConstraint = rule.startDate != null || rule.endDate != null;

  // Règle sans aucune contrainte (état transitoire/incomplet, ex: item optimiste
  // avant résolution de la mutation) : ne doit jamais matcher tous les jours.
  if (!hasWeeklyConstraint && !hasRangeConstraint) return false;

  if (hasWeeklyConstraint && rule.dayOfWeek !== isoDayOfWeek(date)) return false;

  const key = localDayKey(date);
  if (rule.startDate && key < storedDayKey(rule.startDate)) return false;
  if (rule.endDate && key > storedDayKey(rule.endDate)) return false;

  return true;
}

/** Plage horaire en minutes depuis minuit, ou null = journée entière. */
export function getTimeWindow(rule: UnavailabilityRule): { start: number; end: number } | null {
  if (!rule.startTime || !rule.endTime) return null;
  return { start: minutesUTC(rule.startTime), end: minutesUTC(rule.endTime) };
}

/**
 * Le créneau [slotStart, slotEnd[ tombe-t-il dans l'indisponibilité ?
 * À utiliser pour les conflits de planning (un créneau ne traverse pas minuit).
 * Convention : l'heure « murale » du créneau (locale) est comparée aux heures saisies,
 * stockées en UTC 1970 par toTimeOfDayUTC.
 */
export function overlapsSlot(rule: UnavailabilityRule, slotStart: Date, slotEnd: Date): boolean {
  if (!appliesOnDay(rule, slotStart)) return false;

  const window = getTimeWindow(rule);
  if (!window) return true; // journée entière

  const start = slotStart.getHours() * 60 + slotStart.getMinutes();
  const end = slotEnd.getHours() * 60 + slotEnd.getMinutes();
  return start < window.end && end > window.start;
}