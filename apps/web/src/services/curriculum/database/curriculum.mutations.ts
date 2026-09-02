import { prisma } from "@/lib/prisma";
import { tryConstraint } from "@/utils/server/prisma";
import { invalidateEvent } from "@/cache/server/key";

// TODO: remplacer par les vrais champs du modèle Curriculum
export type CreateCurriculumData = { name: string; orgId: string };

export async function createCurriculum({ orgId, ...data }: CreateCurriculumData) {
  const result = await tryConstraint(
    prisma.curriculum.create({ data: { ...data, orgId }, select: { id: true } }),
  );
  await invalidateEvent("CURRICULUM_CREATED", orgId);
  return result;
}

export async function deleteCurriculum(curriculumId: string, orgId: string) {
  const result = await tryConstraint(
    prisma.curriculum.delete({
      where: { id: curriculumId, orgId },
      select: { id: true },
    }),
  );
  await invalidateEvent("CURRICULUM_DELETED", orgId, curriculumId);
  return result;
}
