// src/services/teacher-unavailability/validation.ts
import * as v from "valibot";

import { validateWithId } from "@/utils/server/validation";
import type { CreateUnavailabilityData } from "./types";

// "HH:mm" sur 24 h, zéro-paddé : la comparaison lexicographique = comparaison horaire.
const hhmm = v.pipe(v.string(), v.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (format HH:mm)"));

const optionalDate = v.optional(v.nullable(v.date()));

/**
 * Contrat d'entrée UNIQUE, identique pour toute forme d'indisponibilité — l'UI envoie
 * toujours les mêmes champs, la résolution vers les colonnes se fait dans
 * `resolveUnavailabilityFields` (jamais côté UI) :
 *
 *   dayOfWeek            : un jour de semaine précis (ISO, 1 = lundi)   — null = tous les jours
 *   startDate / endDate  : période de validité, vraies dates (inclusive) — null = sans limite
 *   timeRange            : { start, end } en "HH:mm"                     — null = journée entière
 *
 * Contrainte : au moins un jour de semaine OU une période.
 *
 * Exemples :
 *   tous les mardis 8h-10h du 1er sept. au 15 déc. → dayOfWeek + période + timeRange
 *   de 8h à 10h du 1er au 30 sept.                 → période + timeRange
 *   congés du 1er au 15 août                       → période seule
 */
export const createUnavailabilitySchema = v.pipe(
  v.object({
    reason: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
    dayOfWeek: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(7)))),
    startDate: optionalDate,
    endDate: optionalDate,
    timeRange: v.optional(v.nullable(v.object({ start: hhmm, end: hhmm }))),
  } satisfies Record<keyof CreateUnavailabilityData, unknown>),

  // Période : les deux bornes ou aucune, dans le bon ordre
  v.forward(
    v.partialCheck(
      [["startDate"], ["endDate"]],
      (i) => (i.startDate == null) === (i.endDate == null),
      "Renseignez le premier et le dernier jour, ou aucun des deux",
    ),
    ["endDate"],
  ),
  v.forward(
    v.partialCheck(
      [["startDate"], ["endDate"]],
      (i) => !i.startDate || !i.endDate || i.startDate <= i.endDate,
      "Le dernier jour doit être après le premier",
    ),
    ["endDate"],
  ),

  // Heures : fin après début
  v.forward(
    v.partialCheck(
      [["timeRange"]],
      (i) => i.timeRange == null || i.timeRange.start < i.timeRange.end,
      "L'heure de fin doit être après l'heure de début",
    ),
    ["timeRange"],
  ),

  // Il faut au moins une borne de portée
  v.forward(
    v.partialCheck(
      [["dayOfWeek"], ["startDate"]],
      (i) => i.dayOfWeek != null || i.startDate != null,
      "Choisissez un jour récurrent ou une période",
    ),
    ["startDate"],
  ),
);

export type CreateUnavailabilityInput = v.InferInput<typeof createUnavailabilitySchema>;
export type CreateUnavailabilityOutput = v.InferOutput<typeof createUnavailabilitySchema>;

// Modification = remplacement complet de la règle : même schéma que la création.
export const updateUnavailabilityDataSchema = createUnavailabilitySchema;

export type UpdateUnavailabilityDataInput = CreateUnavailabilityInput;
export type UpdateUnavailabilityDataOutput = CreateUnavailabilityOutput;

export const updateUnavailabilitySchema = validateWithId("teacherUnavailabilityId", updateUnavailabilityDataSchema);

export type UpdateUnavailabilityInput = v.InferInput<typeof updateUnavailabilitySchema>;
export type UpdateUnavailabilityOutput = v.InferOutput<typeof updateUnavailabilitySchema>;