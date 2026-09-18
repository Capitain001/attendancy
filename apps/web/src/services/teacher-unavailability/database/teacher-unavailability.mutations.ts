import { prisma } from "@/lib/prisma";
import { tryConstraint } from "@/utils/server/prisma";
import { invalidateEvent } from "@/cache/server/graph";
import type { CreateUnavailabilityInput, UpdateUnavailabilityDataOutput } from "../validation";
import { resolveUnavailabilityFields } from "../utils";

export async function createTeacherUnavailability(orgId: string, teacherId: string, data: CreateUnavailabilityInput) {
  const record = await tryConstraint(
    prisma.teacherUnavailability.create({
      data: {
        orgId,
        teacherId,
        reason: data.reason ?? null,

        ...resolveUnavailabilityFields(data),
      },
      select: { id: true, teacherId: true }, // ← Sélectionne teacherId pour l'invalidation
    }),
  );

  invalidateEvent("TEACHER_UNAVAILABILITY_CREATED", orgId, record.teacherId);
  return record;
}

export async function updateTeacherUnavailability(
  teacherUnavailabilityId: string,
  orgId: string,
  teacherId: string,
  data: UpdateUnavailabilityDataOutput,
) {
  const { reason, dayOfWeek, startDate, endDate } = data;

  // Calcul propre des champs de créneau 
  const slotFields = startDate !== undefined && endDate !== undefined
    ? resolveUnavailabilityFields({ dayOfWeek, startDate, endDate }, { resetUnusedFields: true })
    : undefined;

  const record = await tryConstraint(
    prisma.teacherUnavailability.update({
      where: { id: teacherUnavailabilityId, orgId },
      data: {
        teacherId,
        reason,
        ...slotFields,
      },
      select: { id: true, teacherId: true , startTime:true , endTime:true }, // ← On récupère teacherId même s'il n'a pas été modifié
    }),
  );

  invalidateEvent("TEACHER_UNAVAILABILITY_UPDATED", orgId, record.teacherId);
  return record;
}

export async function deleteTeacherUnavailability(id: string, orgId: string) {
  const record = await prisma.teacherUnavailability.delete({
    where: { id, orgId },
    select: { teacherId: true },
  });

  invalidateEvent("TEACHER_UNAVAILABILITY_DELETED", orgId, record.teacherId);
  return record;
}