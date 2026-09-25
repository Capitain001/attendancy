import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

import type { UnavailabilityRule } from "@/services/teacher-unavailability/policy";

const DAY_LABELS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Colonne date (minuit UTC) → Date locale du même jour calendaire.
 * Évite qu'un fuseau négatif affiche la veille.
 */
function storedDateToLocal(value: Date | string): Date {
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Badge : « Chaque mardi » pour une récurrence, « Ponctuelle » sinon. */
export function formatRecurrence(rule: Pick<UnavailabilityRule, "dayOfWeek">): string {
  return rule.dayOfWeek != null ? `Chaque ${DAY_LABELS[rule.dayOfWeek]}` : "Ponctuelle";
}

/** « 08:00 – 10:00 » ou « Journée entière ». Heures lues en UTC (heure murale stockée). */
export function formatTimeRange(rule: Pick<UnavailabilityRule, "startTime" | "endTime">): string {
  if (!rule.startTime || !rule.endTime) return "Journée entière";

  const start = new Date(rule.startTime);
  const end = new Date(rule.endTime);
  return `${pad(start.getUTCHours())}:${pad(start.getUTCMinutes())} – ${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`;
}

/**
 * Période de validité : « 12 mars 2026 », « 1 sept. – 30 sept. 2026 »…
 * Récurrence sans dates → « Sans limite de durée » ; ponctuelle sans dates : null (ne devrait pas exister).
 */
export function formatPeriod(
  rule: Pick<UnavailabilityRule, "dayOfWeek" | "startDate" | "endDate">,
): string | null {
  if (!rule.startDate || !rule.endDate) {
    return rule.dayOfWeek != null ? "Sans limite de durée" : null;
  }

  const start = storedDateToLocal(rule.startDate);
  const end = storedDateToLocal(rule.endDate);

  if (isSameDay(start, end)) return format(start, "d MMMM yyyy", { locale: fr });

  return start.getFullYear() === end.getFullYear()
    ? `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`
    : `${format(start, "d MMM yyyy", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
}