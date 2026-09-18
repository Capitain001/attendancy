import { Prisma, UnavailabilityType } from "@/generated/prisma/browser";
import type { UpdateUnavailabilityDataOutput } from "./validation";

function toTimeOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(1970, 0, 1, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
}

export type UnavailabilityInputSlot = Pick<
  UpdateUnavailabilityDataOutput,
  "dayOfWeek" | "startDate" | "endDate"
>;

export type BaseFields = "orgId" | "teacherId" | "reason";

// Le type de retour garantit la présence de `type` tout en ignorant les champs gérés par la mutation
export type ResolvedSlotFields = Omit<
  Prisma.TeacherUnavailabilityUncheckedCreateInput,
  BaseFields
>;

export function resolveUnavailabilityFields(
  data: Partial<UnavailabilityInputSlot>,
  options: { resetUnusedFields?: boolean } = {}
) {
  // Guard explicite : sécurise le runtime et garantit le typage strict pour TypeScript
  if (!data.startDate || !data.endDate) {
    throw new Error("startDate et endDate sont requis pour calculer les créneaux.");
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