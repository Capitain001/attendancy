import * as v from "valibot";

// HH:MM strict — heures 00–23, minutes 00–59 (rejette 99:99)
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const uuidField = v.pipe(v.string(), v.uuid("UUID requis"));
const timeString = v.pipe(v.string(), v.regex(TIME_REGEX, "Format HH:MM requis"));

const baseFields = {
  teacherId: uuidField,
  reason: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200))),
};

// --- WEEKLY (récurrent) ---

const weeklyFields = v.object({
  ...baseFields,
  dayOfWeek: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(7)), // ISO, 1=lundi
  startTime: timeString,
  endTime: timeString,
});

export const createWeeklyUnavailabilitySchema = v.pipe(
  weeklyFields,
  v.forward(
    v.partialCheck(
      [["startTime"], ["endTime"]],
      ({ startTime, endTime }) => startTime < endTime,
      "L'heure de fin doit être après l'heure de début",
    ),
    ["endTime"],
  ),
);

// --- DATE_RANGE (ponctuel) ---

const dateRangeFields = v.object({
  ...baseFields,
  startDate: v.date(),
  endDate: v.date(),
});

export const createDateRangeUnavailabilitySchema = v.pipe(
  dateRangeFields,
  v.forward(
    v.partialCheck(
      [["startDate"], ["endDate"]],
      ({ startDate, endDate }) => startDate <= endDate,
      "La date de fin doit être après la date de début",
    ),
    ["endDate"],
  ),
);

// --- Schéma unique consommé par le formulaire : le discriminant `type`
// route vers l'une des deux formes. Les objets de base ne sont PAS pipés
// (weeklyFields / dateRangeFields), donc `.entries` reste accessible ici —
// chaque variante applique ensuite sa propre cross-validation.

export const createUnavailabilitySchema = v.variant("type", [
  v.pipe(
    v.object({ type: v.literal("WEEKLY"), ...weeklyFields.entries }),
    v.forward(
      v.partialCheck(
        [["startTime"], ["endTime"]],
        ({ startTime, endTime }) => startTime < endTime,
        "L'heure de fin doit être après l'heure de début",
      ),
      ["endTime"],
    ),
  ),
  v.pipe(
    v.object({ type: v.literal("DATE_RANGE"), ...dateRangeFields.entries }),
    v.forward(
      v.partialCheck(
        [["startDate"], ["endDate"]],
        ({ startDate, endDate }) => startDate <= endDate,
        "La date de fin doit être après la date de début",
      ),
      ["endDate"],
    ),
  ),
]);

export type CreateWeeklyUnavailabilityInput = v.InferInput<typeof createWeeklyUnavailabilitySchema>;
export type CreateDateRangeUnavailabilityInput = v.InferInput<typeof createDateRangeUnavailabilitySchema>;
export type CreateUnavailabilityInput = v.InferInput<typeof createUnavailabilitySchema>;