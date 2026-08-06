import { prisma } from "@/lib/prisma";

export async function createTestOrg() {
  return prisma.organization.create({
    data: { name: `test-org-${Date.now()}`, slug: `test-${crypto.randomUUID()}` },
    select: { id: true, slug: true },
  });
}

export async function cleanupTestOrg(orgId: string) {
  // CourseTeacher n'a pas d'orgId direct — scope via le cours parent.
  await prisma.courseTeacher.deleteMany({ where: { course: { orgId } } });
  await prisma.organization.delete({ where: { id: orgId } });
}
