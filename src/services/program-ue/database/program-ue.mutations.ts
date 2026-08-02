import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/config/cache";
import { tryUnique } from "@/utils/server";
import { Prisma } from "@/generated/prisma/client";

export async function addUEToProgram({
  programId,
  ueId,
  semester,
  order,
  isOptional = false,
}: {
  programId: string;
  ueId: string;
  semester?: number;
  order?: number;
  isOptional?: boolean;
}) {
  const result = await tryUnique(
    prisma.programUE.create({
      data: {
        programId,
        ueId,
        semester,
        order,
        isOptional,
      },
    })
  );

  await invalidateCache("PROGRAM", programId);
  return result;
}

export async function removeUEFromProgram({
  programUEId,
  programId,
  ueId,
}: {
  programUEId?: string;
  programId: string;
  ueId?: string;
}) {
  const where: Prisma.ProgramUEWhereInput = { programId };

  if (programUEId) {
    where.id = programUEId;
  } else if (ueId) {
    where.ueId = ueId;
  } else {
    throw new Error("programUEId ou ueId requis");
  }

  const result = await prisma.programUE.deleteMany({ where });

  await invalidateCache("PROGRAM", programId);
  await invalidateCache("PROGRAM_UE", programId);

  if (ueId) {
    await invalidateCache("UE", ueId);
  }

  return result;
}

export async function updateProgramUE({
  programId,
  ueId,
  data,
}: {
  programId: string;
  ueId: string;
  data: {
    semester?: number;
    order?: number;
    isOptional?: boolean;
    isCompleted?: boolean;
  };
}) {
  const result = await prisma.programUE.updateMany({
    where: {
      programId,
      ueId,
    },
    data,
  });

  await invalidateCache("PROGRAM", programId);
  return result;
}
