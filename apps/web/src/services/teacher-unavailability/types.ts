import { GetTeacherUnavailabilitiesDto } from './generated.types'

export type TeacherUnavailabilityItem     = GetTeacherUnavailabilitiesDto[number]
export * from './generated.types'

import type { Prisma } from "@/generated/prisma/client";

export type CreateUnavailabilityData = Pick<
  Prisma.TeacherUnavailabilityUncheckedCreateInput,
   "reason" | "dayOfWeek" | "startDate" | "endDate"
>;

export type UpdateUnavailabilityData = Partial<CreateUnavailabilityData>;