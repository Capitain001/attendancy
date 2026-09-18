import { Prisma, UnavailabilityType } from "@/generated/prisma/browser";
import type { UpdateUnavailabilityDataOutput } from "./validation";

function toTimeOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(1970, 0, 1, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
}

export type UnavailabilityInputSlot = Pick<
  UpdateUnavailabilityDataOutput,
  "dayOfWeek" | "startDate" | "endDate"
>;

// 1. Types Prisma stricts
type CreateSlotFields = Prisma.TeacherUnavailabilityUncheckedCreateInput;
type UpdateSlotFields = Prisma.TeacherUnavailabilityUncheckedUpdateInput;

// Overload 1 : Utilisé en CREATE ou quand startDate/endDate sont garantis présents
export function resolveUnavailabilityFields(
  data: UnavailabilityInputSlot & { startDate: Date; endDate: Date },
  options?: { resetUnusedFields?: boolean }
): CreateSlotFields;

// Overload 2 : Utilisé en UPDATE (champs optionnels)
export function resolveUnavailabilityFields(
  data: UnavailabilityInputSlot,
  options?: { resetUnusedFields?: boolean }
): UpdateSlotFields;

// Implémentation
export function resolveUnavailabilityFields(
  data: UnavailabilityInputSlot,
  options: { resetUnusedFields?: boolean } = {}
): UpdateSlotFields {
  if (data.startDate == null || data.endDate == null) {
    return {};
  }

  const { resetUnusedFields = false } = options;
  const unused = resetUnusedFields ? null : undefined;

  if (data.dayOfWeek != null) {
    return {
      type: UnavailabilityType.WEEKLY,
      dayOfWeek: data.dayOfWeek,
      startTime: toTimeOfDayUTC(data.startDate),
      endTime: toTimeOfDayUTC(data.endDate),
      startDate: unused,
      endDate: unused,
    };
  }

  return {
    type: UnavailabilityType.DATE_RANGE,
    dayOfWeek: unused,
    startTime: unused,
    endTime: unused,
    startDate: data.startDate,
    endDate: data.endDate,
  };
}