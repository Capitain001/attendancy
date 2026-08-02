import { prisma } from "@/lib/prisma";

export async function getProgramUEs({
  programId,
  orgId,
}: {
  programId: string;
  orgId: string;
}) {
  return prisma.programUE.findMany({
    where: { programId },
    select: {
      id: true,
      semester: true,
      ue: {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          ueCourses: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
              duration: true,
              order: true,
              description: true,
            },
          },
        },
      },
    },
  });
}
