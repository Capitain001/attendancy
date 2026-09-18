import * as v from "valibot";

import { validateWithId } from "@/utils/server/validation";
import { CreateUnavailabilityData, UpdateUnavailabilityData } from "./types";

// Compare uniquement l'heure (UTC) d'une Date — le jour porté par la valeur
// est ignoré, cohérent avec `toTimeOfDayUTC` côté service qui ne retient
// que l'heure pour les champs WEEKLY (dayOfWeek + startTime/endTime en
// @db.Time).
function timeOfDayMinutesUTC(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

// --- Schéma create : pas de teacherId (résolu côté action depuis
// l'utilisateur authentifié, jamais depuis l'input client). Pas de
// discriminant `type` non plus — c'est la présence de `dayOfWeek` qui route
// la validation croisée, exactement comme `resolveUnavailabilityFields`
// route l'écriture Prisma :
//   dayOfWeek présent → WEEKLY, comparaison de l'heure seule (Date ignorée)
//   dayOfWeek absent  → DATE_RANGE, comparaison des dates complètes

export const createUnavailabilitySchema = v.pipe(
  v.object({
    reason: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
    dayOfWeek: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(7)))), // ISO, 1=lundi
    startDate: v.date(),
    endDate: v.date(),
  } satisfies Record<keyof CreateUnavailabilityData, unknown>),
  v.forward(
    v.partialCheck(
      [["dayOfWeek"], ["startDate"], ["endDate"]],
      (input) =>
        input.dayOfWeek != null
          ? timeOfDayMinutesUTC(input.startDate) < timeOfDayMinutesUTC(input.endDate)
          : input.startDate <= input.endDate,
      "La fin doit être après le début",
    ),
    ["endDate"],
  ),
);

export type CreateUnavailabilityInput = v.InferInput<typeof createUnavailabilitySchema>;
export type CreateUnavailabilityOutput = v.InferOutput<typeof createUnavailabilitySchema>;

// --- Update : même principe, pas de teacherId côté client — un enseignant
// ne peut jamais réassigner une indisponibilité à quelqu'un d'autre via
// cette action. Le créneau (dayOfWeek + startDate/endDate) se modifie en
// bloc — si une des trois clés est fournie, les deux dates doivent l'être,
// sinon on ne peut pas revalider "fin après début".

export const updateUnavailabilityDataSchema = v.pipe(
  v.object({
    reason: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
    dayOfWeek: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(7)))),
    startDate: v.optional(v.date()),
    endDate: v.optional(v.date()),
  } satisfies Record<keyof UpdateUnavailabilityData, unknown>),
  v.forward(
    v.partialCheck(
      [["dayOfWeek"], ["startDate"], ["endDate"]],
      (input) => {
        const touchesSlot = input.dayOfWeek != null || input.startDate != null || input.endDate != null;
        if (!touchesSlot) return true;
        if (input.startDate == null || input.endDate == null) return false;

        return input.dayOfWeek != null
          ? timeOfDayMinutesUTC(input.startDate) < timeOfDayMinutesUTC(input.endDate)
          : input.startDate <= input.endDate;
      },
      "startDate et endDate doivent être fournis ensemble, avec la fin après le début",
    ),
    ["endDate"],
  ),
);

export type UpdateUnavailabilityDataInput = v.InferInput<typeof updateUnavailabilityDataSchema>;
export type UpdateUnavailabilityDataOutput = v.InferOutput<typeof updateUnavailabilityDataSchema>;

export const updateUnavailabilitySchema = validateWithId("teacherUnavailabilityId", updateUnavailabilityDataSchema);

export type UpdateUnavailabilityInput = v.InferInput<typeof updateUnavailabilitySchema>;
export type UpdateUnavailabilityOutput = v.InferOutput<typeof updateUnavailabilitySchema>;