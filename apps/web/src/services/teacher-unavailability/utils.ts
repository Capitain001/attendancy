// src/services/teacher-unavailability/utils.ts
import { UnavailabilityType } from "@/generated/prisma/browser";
import type { CreateUnavailabilityInput, CreateUnavailabilityOutput, UpdateUnavailabilityDataInput } from "./validation";
import { TeacherUnavailabilityItem } from "./types";

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

/**
 * `toEntityPatch` pour useCrudEntity : traduit ce que l'UI vient d'envoyer
 * (CreateUnavailabilityInput / UpdateUnavailabilityDataInput — timeRange en "HH:mm")
 * en un patch de l'entité affichée (TeacherUnavailabilityItem — startTime/endTime en
 * Date, type dérivé). Même transformation que resolveUnavailabilityFields côté DB :
 * les deux DOIVENT rester en phase, sinon le cache optimiste et l'écriture divergent.
 *
 * Sans ce mapper, `variables` brut (forme UI) était fusionné tel quel dans le cache :
 * `type`/`dayOfWeek` n'y figurent sous aucune forme lisible par TeacherUnavailabilityItem,
 * et restaient absents/périmés tant que le serveur ne les renvoyait pas explicitement
 * (ce qu'il ne fait pas — `select` ne renvoie que id/teacherId/startTime/endTime,
 * volontairement : le reste est reconstruit côté UI à partir de ce qu'elle a elle-même
 * envoyé, pas revalidé par un aller-retour serveur inutile).
 */
export function toUnavailabilityEntityPatch(
  data: CreateUnavailabilityInput | UpdateUnavailabilityDataInput,
): Partial<TeacherUnavailabilityItem> {
  return {
    reason: data.reason ?? null,
    ...resolveUnavailabilityFields(data),
  };
}
 