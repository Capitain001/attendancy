// src/services/teacher-unavailability/database/teacher-unavailability.mutations.ts
import { prisma } from "@/lib/prisma";
import { tryConstraint } from "@/utils/server/prisma";
import { invalidateEvent } from "@/cache/server/graph";
import type { CreateUnavailabilityOutput, UpdateUnavailabilityDataOutput } from "../validation";
import { resolveUnavailabilityFields } from "../utils";

export async function createTeacherUnavailability(
  orgId: string,
  teacherId: string,
  data: CreateUnavailabilityOutput,
) {
  const record = await tryConstraint(
    prisma.teacherUnavailability.create({
      data: {
        orgId,
        teacherId,
        reason: data.reason ?? null,
        ...resolveUnavailabilityFields(data),
      },
      select: { id: true, teacherId: true , startTime: true, endTime: true },
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
  const record = await tryConstraint(
    prisma.teacherUnavailability.update({
      // teacherId dans le where : un enseignant ne peut modifier que SES indisponibilités.
      where: { id: teacherUnavailabilityId, orgId, teacherId },
      data: {
        // teacherId n'est plus écrit : avant, il réaffectait l'enregistrement à l'appelant.
        reason: data.reason ?? null,
        ...resolveUnavailabilityFields(data),
      },
      select: { id: true, teacherId: true, startTime: true, endTime: true },
    }),
  );

  invalidateEvent("TEACHER_UNAVAILABILITY_UPDATED", orgId, record.teacherId);
  return record;
}

export async function deleteTeacherUnavailability(id: string, orgId: string, teacherId: string) {
  const record = await prisma.teacherUnavailability.delete({
    // teacherId dans le where : même règle de propriété que pour l'update.
    where: { id, orgId, teacherId },
    select: { teacherId: true },
  });

  invalidateEvent("TEACHER_UNAVAILABILITY_DELETED", orgId, record.teacherId);
  return record;
}