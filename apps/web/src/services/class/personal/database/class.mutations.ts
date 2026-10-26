import { tryConstraint } from "@/utils/server"
import { UpdatePersonalClassDataOutput } from "../validation"
import { prisma } from "@/lib/prisma"
import { invalidateEvent } from "@/cache/server/graph"

export async function updatePersonalClass(
  classId: string,
  orgId: string,
  data: UpdatePersonalClassDataOutput,
) {
  const result = await tryConstraint(
    prisma.class.update({
      where: { id: classId, programTrack: { orgId } },
      data,
      select: { id: true },
    }),
  )

  await invalidateEvent('CLASS_UPDATED', orgId, classId)
  return result
}