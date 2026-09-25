// src/services/teacher-unavailability/utils.ts
import { UnavailabilityType } from "@/generated/prisma/browser";
import type { CreateUnavailabilityOutput } from "./validation";

/** "HH:mm" → valeur de colonne @db.Time (1970-01-01 UTC, seul l'horaire compte). */
function hhmmToTime(value: string): Date {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours ?? 0, minutes ?? 0));
}

export type UnavailabilitySlotInput = Pick<
  CreateUnavailabilityOutput,
  "dayOfWeek" | "startDate" | "endDate" | "timeRange"
>;

type ResolvedTimeAndPeriod = {
  startDate: Date | null;
  endDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
};

/**
 * Le seul invariant qui survit au modèle à trois axes : `type` ⇔ `dayOfWeek`.
 * Période et heures sont indépendantes (nullables dans les deux branches).
 */
export type ResolvedUnavailabilityFields =
  | (ResolvedTimeAndPeriod & { type: "WEEKLY"; dayOfWeek: number })
  | (ResolvedTimeAndPeriod & { type: "DATE_RANGE"; dayOfWeek: null });

/**
 * Seul endroit où le contrat d'entrée (dayOfWeek / startDate / endDate / timeRange)
 * est traduit en colonnes Prisma. L'UI n'a jamais connaissance de startTime/endTime.
 *
 * Chaque colonne est écrite telle quelle, `null` si l'axe est absent (jamais `undefined`,
 * qui signifierait « ne pas toucher » pour Prisma). Même résultat pour create et update
 * (remplacement complet).
 */
export function resolveUnavailabilityFields(data: UnavailabilitySlotInput) {
  const shared: ResolvedTimeAndPeriod = {
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    startTime: data.timeRange ? hhmmToTime(data.timeRange.start) : null,
    endTime: data.timeRange ? hhmmToTime(data.timeRange.end) : null,
  };

  return data.dayOfWeek != null
    ? { ...shared, type: UnavailabilityType.WEEKLY, dayOfWeek: data.dayOfWeek }
    : { ...shared, type: UnavailabilityType.DATE_RANGE, dayOfWeek: null };
}