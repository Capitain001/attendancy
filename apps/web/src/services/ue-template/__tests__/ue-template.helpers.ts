import { prisma } from "@/lib/prisma";

export async function createTestOrg() {
  return prisma.organization.create({
    data: { name: `test-org-${Date.now()}`, slug: `test-${crypto.randomUUID()}` },
    select: { id: true, slug: true },
  });
}

export async function cleanupTestOrg(orgId: string) {
  await prisma.orgUETemplate.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
}
