import { prisma } from "@/lib/prisma";
import { tryConstraint } from "@/utils/server/prisma";
import { invalidateEvent } from "@/cache/server/graph";
import type { CreateUnavailabilityInput, UpdateUnavailabilityDataOutput } from "../validation";
import { resolveUnavailabilityFields } from "../utils";

export async function createTeacherUnavailability(orgId: string, teacherId: string, data: CreateUnavailabilityInput) {
  const record = await tryConstraint(
    prisma.teacherUnavailability.create({
      data: {
        ...resolveUnavailabilityFields(data),
      },
      select: { id:true, teacherId: true }, // ← Sélectionne teacherId pour l'invalidation
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

  const record = await tryConstraint(
    prisma.teacherUnavailability.update({
      where: { id: teacherUnavailabilityId, orgId },
      data: {
        ...(teacherId !== undefined && { teacherId }),
        ...(reason !== undefined && { reason }),
        ...(startDate !== undefined && endDate !== undefined
          ? resolveUnavailabilityFields({ dayOfWeek, startDate, endDate }, { resetUnusedFields: true })
          : {}),
      },
      select: {id:true, teacherId: true }, // ← On récupère teacherId même s'il n'a pas été modifié
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