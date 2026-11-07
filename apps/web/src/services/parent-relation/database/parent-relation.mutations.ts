import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export function ensureParentRelation(
  client: Pick<typeof prisma | Prisma.TransactionClient, "parentRelation">,
  params: {
    parentId: string;
    studentId: string;
    relation: string;
    orgId: string;
  },
) {
  const { parentId, studentId, relation, orgId } = params;

  return client.parentRelation.upsert({
    where: { parentId_studentId: { parentId, studentId } },
    create: { parentId, studentId, relation, orgId },
    update: {},
    select: { id: true },
  });
}
